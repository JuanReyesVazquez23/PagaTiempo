from decimal import Decimal
from uuid import uuid4

import pytest

from app.allocation import allocate_payment


def test_allocate_fills_earliest_months() -> None:
    first = uuid4()
    second = uuid4()
    result = allocate_payment(
        [
            {"id": first, "month_index": 1, "remaining": Decimal("500.00")},
            {"id": second, "month_index": 2, "remaining": Decimal("500.00")},
        ],
        Decimal("700.00"),
        None,
    )
    assert result == [
        {"installment_id": str(first), "month_index": 1, "amount": "500.00"},
        {"installment_id": str(second), "month_index": 2, "amount": "200.00"},
    ]


def test_allocate_from_chosen_month() -> None:
    first = uuid4()
    second = uuid4()
    result = allocate_payment(
        [
            {"id": first, "month_index": 1, "remaining": Decimal("500.00")},
            {"id": second, "month_index": 2, "remaining": Decimal("500.00")},
        ],
        Decimal("100.00"),
        2,
    )
    assert result == [{"installment_id": str(second), "month_index": 2, "amount": "100.00"}]


def test_overpay_sticks_to_last_month() -> None:
    only = uuid4()
    result = allocate_payment(
        [{"id": only, "month_index": 1, "remaining": Decimal("50.00")}],
        Decimal("80.00"),
        None,
    )
    assert result == [{"installment_id": str(only), "month_index": 1, "amount": "80.00"}]


def test_no_installments_raises_instead_of_crashing() -> None:
    with pytest.raises(ValueError):
        allocate_payment([], Decimal("100.00"), None)


def test_month_index_outside_cycle_raises() -> None:
    only = uuid4()
    with pytest.raises(ValueError):
        allocate_payment(
            [{"id": only, "month_index": 1, "remaining": Decimal("500.00")}],
            Decimal("100.00"),
            5,
        )
