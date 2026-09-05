import { useOptimistic, useState } from "react";

import { ApiError, createPayment, type StudentDetail } from "../../../lib/api";
import { PaymentLedgerPresentation } from "./presentation";

interface Props {
  student: StudentDetail;
  onUpdated: (detail: StudentDetail) => void;
  isAdmin?: boolean;
  onResetStudent?: () => void;
  onDeleteStudent?: () => void;
}

export function PaymentLedger({ student, onUpdated, isAdmin, onResetStudent, onDeleteStudent }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [optimisticStudent, addOptimistic] = useOptimistic(student);

  async function submit(formData: FormData): Promise<void> {
    const amount = String(formData.get("amount") ?? "");
    const monthRaw = String(formData.get("month_index") ?? "");
    const note = String(formData.get("note") ?? "");
    const month_index = monthRaw ? Number(monthRaw) : null;
    setError(null);
    setSuccess(null);
    addOptimistic({
      ...student,
      total_paid: student.total_paid,
      payments: [
        {
          id: `temp-${Date.now()}`,
          amount,
          note: note || null,
          recorded_at: new Date().toISOString(),
          allocations: [],
        },
        ...student.payments,
      ],
    });
    try {
      const updated = await createPayment(student.id, { amount, month_index, note });
      onUpdated(updated);
      setSuccess(`Registrado ${amount} para ${updated.full_name}.`);
    } catch (cause: unknown) {
      const message = cause instanceof ApiError ? cause.message : "No se pudo guardar el pago";
      setError(message);
    }
  }

  return (
    <PaymentLedgerPresentation
      student={optimisticStudent}
      error={error}
      success={success}
      isAdmin={isAdmin}
      onResetStudent={onResetStudent}
      onDeleteStudent={onDeleteStudent}
      onSubmit={submit}
    />
  );
}
