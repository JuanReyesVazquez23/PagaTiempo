from datetime import date

from dateutil.relativedelta import relativedelta

MONTHS_ES = (
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
)


def month_start(cycle_start: date, month_index: int) -> date:
    return cycle_start.replace(day=1) + relativedelta(months=month_index - 1)


def month_label(period_start: date) -> str:
    return f"{MONTHS_ES[period_start.month - 1]} {period_start.year}"


def cycle_labels(cycle_start: date, months: int) -> list[str]:
    return [month_label(month_start(cycle_start, index)) for index in range(1, months + 1)]
