from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.calendar_util import month_start
from app.config import Settings
from app.models import Installment, Student

EXAMPLE_STUDENTS = ("Juan Pérez", "María García", "Pedro López")


def ensure_extensions(db: Session) -> None:
    db.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    db.commit()


def seed_if_empty(db: Session, settings: Settings) -> None:
    existing = db.scalar(select(Student.id).limit(1))
    if existing is not None:
        return

    quota = Decimal(settings.monthly_quota)
    for name in EXAMPLE_STUDENTS:
        student = Student(full_name=name)
        db.add(student)
        db.flush()
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
