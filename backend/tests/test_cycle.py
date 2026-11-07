from datetime import date
from decimal import Decimal

import pytest

from app.calendar_util import cycle_labels
from app.cycle import build_cycle_plan


def test_cycle_starts_in_december_and_prorates_june() -> None:
    plan = build_cycle_plan(
        start=date(2026, 12, 1),
        months=7,
        monthly_quota="800.00",
        last_month_weeks=2,
        weeks_per_month=4,
    )

    assert [item.period_start for item in plan] == [
        date(2026, 12, 1),
        date(2027, 1, 1),
        date(2027, 2, 1),
        date(2027, 3, 1),
        date(2027, 4, 1),
        date(2027, 5, 1),
        date(2027, 6, 1),
    ]
    assert [item.expected_amount for item in plan] == [
        Decimal("800.00"),
        Decimal("800.00"),
        Decimal("800.00"),
        Decimal("800.00"),
        Decimal("800.00"),
        Decimal("800.00"),
        Decimal("400.00"),
    ]
    assert sum((item.expected_amount for item in plan), Decimal("0.00")) == Decimal("5200.00")


def test_cycle_labels_match_the_new_cycle() -> None:
    assert cycle_labels(date(2026, 12, 1), 7) == [
        "Diciembre 2026",
        "Enero 2027",
        "Febrero 2027",
        "Marzo 2027",
        "Abril 2027",
        "Mayo 2027",
        "Junio 2027",
    ]


def test_last_month_weeks_must_fit_inside_the_month() -> None:
    with pytest.raises(ValueError):
        build_cycle_plan(date(2026, 12, 1), 7, "800.00", last_month_weeks=5)
