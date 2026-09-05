from decimal import Decimal
from typing import TypedDict
from uuid import UUID


class OpenInstallment(TypedDict):
    id: UUID
    month_index: int
    remaining: Decimal


def allocate_payment(
    installments: list[OpenInstallment],
    amount: Decimal,
    month_index: int | None,
) -> list[dict]:
    """Spread a payment across months. Extra goes to the last touched month."""
    if amount <= 0:
        raise ValueError("El importe debe ser mayor que cero")

    ordered = sorted(installments, key=lambda item: item["month_index"])
    if month_index is not None:
        ordered = [item for item in ordered if item["month_index"] >= month_index]
    if not ordered:
        raise ValueError("El estudiante no tiene cuotas para aplicar el pago")

    remaining = amount
    allocations: list[dict] = []

    for item in ordered:
        if remaining <= 0:
            break
        due = item["remaining"]
        if due <= 0:
            continue
        take = due if due <= remaining else remaining
        allocations.append(
            {
                "installment_id": str(item["id"]),
                "month_index": item["month_index"],
                "amount": f"{take:.2f}",
            }
        )
        remaining -= take

    if remaining > 0:
        target = ordered[-1]
        extra = remaining
        if allocations and allocations[-1]["installment_id"] == str(target["id"]):
            current = Decimal(allocations[-1]["amount"])
            allocations[-1]["amount"] = f"{(current + extra):.2f}"
        else:
            allocations.append(
                {
                    "installment_id": str(target["id"]),
                    "month_index": target["month_index"],
                    "amount": f"{extra:.2f}",
                }
            )

    return allocations
