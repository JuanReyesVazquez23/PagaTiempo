from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session, selectinload

from app.auth import require_admin
from app.calendar_util import month_start
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Installment, Payment, Student
from app.routers.students import _detail
from app.schemas import StudentCreate, StudentDetail

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.post("/students", response_model=StudentDetail, status_code=status.HTTP_201_CREATED)
def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> StudentDetail:
    clean_name = body.full_name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del estudiante es obligatorio",
        )

    existing = db.scalar(
        select(Student.id).where(func.lower(Student.full_name) == func.lower(clean_name))
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un estudiante registrado con ese nombre",
        )

    student = Student(full_name=clean_name)
    db.add(student)
    db.flush()

    quota = Decimal(settings.monthly_quota)
    for month_index in range(1, settings.cycle_months + 1):
        db.add(
            Installment(
                student_id=student.id,
                month_index=month_index,
                period_start=month_start(settings.cycle_start, month_index),
                expected_amount=quota,
                paid_amount=Decimal("0.00"),
            )
        )
    db.commit()

    loaded = db.scalar(
        select(Student)
        .options(selectinload(Student.installments), selectinload(Student.payments))
        .where(Student.id == student.id)
    )
    assert loaded is not None
    return _detail(loaded)


@router.delete("/students/{student_id}")
def delete_student(
    student_id: UUID,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    student = db.scalar(select(Student).where(Student.id == student_id))
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )
    db.delete(student)
    db.commit()
    return {"status": "ok", "deleted_id": str(student_id)}


@router.post("/students/{student_id}/reset", response_model=StudentDetail)
def reset_student_account(
    student_id: UUID,
    db: Session = Depends(get_db),
) -> StudentDetail:
    student = db.scalar(
        select(Student)
        .options(selectinload(Student.installments), selectinload(Student.payments))
        .where(Student.id == student_id)
    )
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )

    db.execute(delete(Payment).where(Payment.student_id == student_id))
    db.execute(
        update(Installment)
        .where(Installment.student_id == student_id)
        .values(paid_amount=Decimal("0.00"))
    )
    db.commit()

    reloaded = db.scalar(
        select(Student)
        .options(selectinload(Student.installments), selectinload(Student.payments))
        .where(Student.id == student_id)
    )
    assert reloaded is not None
    return _detail(reloaded)


@router.post("/reset-all")
def reset_all_accounts(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(delete(Payment))
    db.execute(update(Installment).values(paid_amount=Decimal("0.00")))
    db.commit()
    return {"status": "ok", "message": "Todas las cuentas han sido limpiadas y reiniciadas"}
