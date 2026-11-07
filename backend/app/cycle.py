from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import NamedTuple

from app.calendar_util import month_start

MONEY = Decimal("0.01")


class CycleInstallment(NamedTuple):
    month_index: int
    period_start: date
    expected_amount: Decimal


def _money(value: str | Decimal) -> Decimal:
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def build_cycle_plan(
    start: date,
    months: int,
    monthly_quota: str | Decimal,
    last_month_weeks: int | None = None,
    weeks_per_month: int = 4,
) -> list[CycleInstallment]:
    """Build the installments for a cycle.

    The last month can be prorated when the cycle ends mid-month. For example,
    a 2-week June inside a 4-week month pays half of the monthly quota.
    """
    if months < 1:
        raise ValueError("El ciclo debe tener al menos un mes")
    if weeks_per_month < 1:
        raise ValueError("Las semanas por mes deben ser mayores que cero")
    if last_month_weeks is not None and not 1 <= last_month_weeks <= weeks_per_month:
        raise ValueError("Las semanas del último mes deben estar entre 1 y las semanas por mes")

    quota = _money(monthly_quota)
    last_amount = quota
    if last_month_weeks is not None:
        last_amount = _money(quota * Decimal(last_month_weeks) / Decimal(weeks_per_month))

    plan: list[CycleInstallment] = []
    for index in range(1, months + 1):
        amount = last_amount if index == months else quota
        plan.append(
            CycleInstallment(
                month_index=index,
                period_start=month_start(start, index),
                expected_amount=amount,
            )
        )
    return plan
