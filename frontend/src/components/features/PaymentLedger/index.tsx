import { useOptimistic, useState } from "react";

import { ApiError, createPayment, type StudentDetail } from "../../../lib/api";
import { PaymentLedgerPresentation } from "./presentation";
import { ReceiptModal } from "../../../components/ui/ReceiptModal";

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
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<{
    studentName: string;
    amount: string;
    date: string;
    note: string | null;
    paymentId: string;
    allocations: Array<{ month_index: number; amount: string }>;
    installments: Array<{ month_index: number; label: string; expected_amount: string }>;
  } | null>(null);
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
      setReceiptOpen(true);
      setReceiptData({
        studentName: updated.full_name,
        amount,
        date: new Date().toISOString(),
        note: note || null,
        paymentId: updated.payments.at(-1)?.id || `temp-${Date.now()}`,
        allocations: updated.payments.at(-1)?.allocations || [],
        installments: student.installments,
      });
    } catch (cause: unknown) {
      const message = cause instanceof ApiError ? cause.message : "No se pudo guardar el pago";
      setError(message);
    }
  }

  return (
    <>
      <PaymentLedgerPresentation
        student={optimisticStudent}
        error={error}
        success={success}
        isAdmin={isAdmin}
        onResetStudent={onResetStudent}
        onDeleteStudent={onDeleteStudent}
        onSubmit={submit}
      />
      {receiptOpen && (
        <ReceiptModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          studentName={receiptData!.studentName}
          amount={receiptData!.amount}
          date={receiptData!.date}
          note={receiptData!.note}
          paymentId={receiptData!.paymentId}
          allocations={receiptData!.allocations}
          installments={receiptData!.installments}
        />
      )}
    </>
  );
}