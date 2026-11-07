from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from app.allocation import allocate_payment
from app.config import Settings
from app.cycle import CycleInstallment
from app.models import Installment, Student


def _money(value: Decimal | None) -> Decimal:
    return Decimal("0.00") if value is None else Decimal(value).quantize(Decimal("0.01"))

EXAMPLE_STUDENTS = ("Juan Pérez", "María García", "Pedro López")
CYCLE_SYNC_LOCK_ID = 726_202_612


def ensure_extensions(db: Session) -> None:
    db.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    db.commit()


def ensure_rate_limit_table(db: Session) -> None:
    db.execute(
        text(
            "CREATE TABLE IF NOT EXISTS rate_limit_attempts ("
            "  id SERIAL PRIMARY KEY,"
            "  client_key TEXT NOT NULL,"
            "  attempted_at DOUBLE PRECISION NOT NULL"
            ")"
        )
    )
    db.execute(
        text("CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time ON rate_limit_attempts (client_key, attempted_at)")
    )
    db.commit()


def seed_if_empty(db: Session, settings: Settings) -> None:
    existing = db.scalar(select(Student.id).limit(1))
    if existing is not None:
        return

    for name in EXAMPLE_STUDENTS:
        student = Student(full_name=name)
        db.add(student)
        db.flush()
        for item in settings.cycle_plan:
            db.add(
                Installment(
                    student_id=student.id,
                    month_index=item.month_index,
                    period_start=item.period_start,
                    expected_amount=item.expected_amount,
                    paid_amount=Decimal("0.00"),
                )
            )
    db.commit()


def _matches_plan(rows: list[Installment], plan: list[CycleInstallment]) -> bool:
    if len(rows) != len(plan):
        return False
    return all(
        row.month_index == item.month_index
        and row.period_start == item.period_start
        and _money(row.expected_amount) == item.expected_amount
        for row, item in zip(rows, plan)
    )


def _rebuild_student_cycle(
    db: Session,
    student: Student,
    plan: list[CycleInstallment],
) -> None:
    """Replace a student's installments without losing their payments.

    Payments are kept and re-applied in chronological order to the new
    installments, so totals and receipt breakdowns stay consistent.
    """
    payments = sorted(student.payments, key=lambda payment: (payment.recorded_at, str(payment.id)))

    student.installments.clear()
    db.flush()

    rows: list[Installment] = []
    for item in plan:
        row = Installment(
            student_id=student.id,
            month_index=item.month_index,
            period_start=item.period_start,
            expected_amount=item.expected_amount,
            paid_amount=Decimal("0.00"),
        )
        student.installments.append(row)
        rows.append(row)
    db.flush()

    by_id = {str(row.id): row for row in rows}
    for payment in payments:
        open_rows = [
            {
                "id": row.id,
                "month_index": row.month_index,
                "remaining": max(
                    _money(row.expected_amount) - _money(row.paid_amount),
                    Decimal("0.00"),
                ),
            }
            for row in rows
        ]
        allocations = allocate_payment(open_rows, _money(payment.amount), None)
        for allocation in allocations:
            row = by_id[allocation["installment_id"]]
            row.paid_amount = _money(row.paid_amount) + Decimal(allocation["amount"])
        payment.allocations = allocations
    db.flush()


def sync_cycle_installments(db: Session, settings: Settings) -> None:
    """Bring existing students in line with the configured cycle.

    New databases and newly created students already use ``settings.cycle_plan``.
    This handles databases created with an older cycle (for example, 10 months
    starting in September) without deleting their payment history.
    """
    plan = settings.cycle_plan

    # Vercel may start several instances at once. Serialize the migration so
    # only one of them rebuilds the installments for the new cycle.
    db.execute(text("SELECT pg_advisory_xact_lock(:lock_id)"), {"lock_id": CYCLE_SYNC_LOCK_ID})

    students = db.scalars(
        select(Student).options(selectinload(Student.installments))
    ).all()

    for student in students:
        rows = sorted(student.installments, key=lambda item: item.month_index)
        if _matches_plan(rows, plan):
            continue
        _rebuild_student_cycle(db, student, plan)

    db.commit()


def create_search_index(db: Session) -> None:
    db.execute(
        text(
            "CREATE INDEX IF NOT EXISTS idx_students_name_trgm "
            "ON students USING gin (full_name gin_trgm_ops)"
        )
    )
    db.execute(
        text("CREATE INDEX IF NOT EXISTS idx_payments_student_recorded ON payments (student_id, recorded_at DESC)")
    )
    db.commit()
