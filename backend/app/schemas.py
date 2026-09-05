from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class MoneyModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("expected_amount", "paid_amount", "remaining", "amount", "total_paid", check_fields=False)
    def serialize_money(self, value: Decimal | None) -> str | None:
        if value is None:
            return None
        return f"{value:.2f}"


class LoginRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=64)


class AdminLoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=256)


class StudentCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


class StudentSummary(MoneyModel):
    id: UUID
    full_name: str
    total_paid: Decimal
    total_expected: Decimal


class InstallmentOut(MoneyModel):
    id: UUID
    month_index: int
    period_start: date
    label: str
    expected_amount: Decimal
    paid_amount: Decimal
    remaining: Decimal
    status: str


class PaymentOut(MoneyModel):
    id: UUID
    amount: Decimal
    note: str | None
    recorded_at: datetime
    allocations: list[dict]


class StudentDetail(MoneyModel):
    id: UUID
    full_name: str
    total_paid: Decimal
    total_expected: Decimal
    installments: list[InstallmentOut]
    payments: list[PaymentOut]


class PaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    month_index: int | None = Field(default=None, ge=1, le=10)
    note: str | None = Field(default=None, max_length=500)


class CycleOut(BaseModel):
    start: date
    months: int
    monthly_quota: str
    currency: str
    labels: list[str]
