from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.allocation import OpenInstallment, allocate_payment
from app.auth import require_treasurer
from app.calendar_util import cycle_labels, month_label
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Installment, Payment, Student
from app.schemas import (
    CycleOut,
    InstallmentOut,
    PaymentCreate,
    PaymentOut,
    StudentDetail,
    StudentSummary,
)

router = APIRouter(prefix="/api", tags=["students"], dependencies=[Depends(require_treasurer)])


def _money(value: Decimal | None) -> Decimal:
    return Decimal("0.00") if value is None else Decimal(value).quantize(Decimal("0.01"))


def _installment_out(row: Installment) -> InstallmentOut:
    expected = _money(row.expected_amount)
    paid = _money(row.paid_amount)
    remaining = expected - paid
    if remaining < 0:
        remaining = Decimal("0.00")
        status_label = "sobrepago"
    elif paid <= 0:
        status_label = "pendiente"
    elif paid < expected:
        status_label = "parcial"
    else:
        status_label = "pagado"
    return InstallmentOut(
        id=row.id,
        month_index=row.month_index,
        period_start=row.period_start,
        label=month_label(row.period_start),
        expected_amount=expected,
        paid_amount=paid,
        remaining=max(expected - paid, Decimal("0.00")),
        status=status_label,
    )


def _detail(student: Student) -> StudentDetail:
    installments = sorted(student.installments, key=lambda item: item.month_index)
    payments = sorted(student.payments, key=lambda item: item.recorded_at, reverse=True)
    total_paid = sum((_money(item.paid_amount) for item in installments), Decimal("0.00"))
    total_expected = sum((_money(item.expected_amount) for item in installments), Decimal("0.00"))
    return StudentDetail(
        id=student.id,
        full_name=student.full_name,
        total_paid=total_paid,
        total_expected=total_expected,
        installments=[_installment_out(item) for item in installments],
        payments=[
            PaymentOut(
                id=item.id,
                amount=_money(item.amount),
                note=item.note,
                recorded_at=item.recorded_at,
                allocations=item.allocations or [],
            )
            for item in payments
        ],
    )


@router.get("/cycle", response_model=CycleOut)
def get_cycle(settings: Settings = Depends(get_settings)) -> CycleOut:
    return CycleOut(
        start=settings.cycle_start,
        months=settings.cycle_months,
        monthly_quota=settings.monthly_quota,
        currency=settings.currency,
        labels=cycle_labels(settings.cycle_start, settings.cycle_months),
    )


@router.get("/students", response_model=list[StudentSummary])
def list_students(
    q: str | None = Query(default=None, max_length=80),
    db: Session = Depends(get_db),
) -> list[StudentSummary]:
    paid_sub = (
        select(Installment.student_id, func.coalesce(func.sum(Installment.paid_amount), 0).label("total_paid"))
        .group_by(Installment.student_id)
        .subquery()
    )
    expected_sub = (
        select(
            Installment.student_id,
            func.coalesce(func.sum(Installment.expected_amount), 0).label("total_expected"),
        )
        .group_by(Installment.student_id)
        .subquery()
    )
    stmt = (
        select(
            Student.id,
            Student.full_name,
            func.coalesce(paid_sub.c.total_paid, 0),
            func.coalesce(expected_sub.c.total_expected, 0),
        )
        .outerjoin(paid_sub, paid_sub.c.student_id == Student.id)
        .outerjoin(expected_sub, expected_sub.c.student_id == Student.id)
        .order_by(Student.full_name)
    )
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(Student.full_name.ilike(pattern))
    rows = db.execute(stmt).all()
    return [
        StudentSummary(
            id=row[0],
            full_name=row[1],
            total_paid=_money(row[2]),
            total_expected=_money(row[3]),
        )
        for row in rows
    ]


@router.get("/students/{student_id}", response_model=StudentDetail)
def get_student(student_id: UUID, db: Session = Depends(get_db)) -> StudentDetail:
    student = db.scalar(
        select(Student)
        .options(selectinload(Student.installments), selectinload(Student.payments))
        .where(Student.id == student_id)
    )
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")
    return _detail(student)


@router.post("/students/{student_id}/payments", response_model=StudentDetail)
def add_payment(
    student_id: UUID,
    body: PaymentCreate,
    db: Session = Depends(get_db),
) -> StudentDetail:
    student = db.scalar(
        select(Student)
        .options(selectinload(Student.installments), selectinload(Student.payments))
        .where(Student.id == student_id)
    )
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")

    open_rows: list[OpenInstallment] = []
    by_id: dict[str, Installment] = {}
    for row in student.installments:
        remaining = _money(row.expected_amount) - _money(row.paid_amount)
        open_rows.append(
            {
                "id": row.id,
                "month_index": row.month_index,
                "remaining": remaining if remaining > 0 else Decimal("0.00"),
            }
        )
        by_id[str(row.id)] = row

    try:
        allocations = allocate_payment(open_rows, body.amount, body.month_index)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    for item in allocations:
        installment = by_id[item["installment_id"]]
        installment.paid_amount = _money(installment.paid_amount) + Decimal(item["amount"])

    payment = Payment(
        student_id=student.id,
        amount=body.amount,
        note=body.note,
        allocations=allocations,
    )
    db.add(payment)
    db.commit()
    student = db.scalar(
        select(Student)
        .options(selectinload(Student.installments), selectinload(Student.payments))
        .where(Student.id == student_id)
    )
    assert student is not None
    return _detail(student)
