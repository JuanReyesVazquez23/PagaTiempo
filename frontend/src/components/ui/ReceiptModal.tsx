import { useEffect } from "react";

import type { Installment } from "../../lib/api";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  amount: string;
  date: string;
  note: string | null;
  paymentId: string;
  allocations: Array<{ month_index: number; amount: string }>;
  installments: Installment[];
}

export function ReceiptModal({
  isOpen,
  onClose,
  studentName,
  amount,
  date,
  note,
  paymentId,
  allocations,
  installments,
}: ReceiptModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedAmount = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(Number(amount));

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="panel modal-card receipt-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
      >
        <div className="modal-header">
          <h3 id="receipt-title" className="modal-title">
            Recibo de Transacción
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="receipt-header">
            <span className="receipt-institution">PagaTiempo</span>
            <span className="receipt-date">{new Date(date).toLocaleDateString(
              "es-DO",
            )}</span>
          </div>

          <div className="receipt-student-info">
            <strong>Estudiante:</strong> {studentName}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-amount">
            <span className="receipt-amount-label">Monto pagado</span>
            <span className="receipt-amount-value">{formattedAmount}</span>
          </div>

          {allocations.length > 0 ? (
            <div className="receipt-allocation">
              <span className="receipt-allocation-label">Desglose de pago:</span>
              {allocations.map((alloc, index) => {
                const installment = installments.find(
                  (inst) => inst.month_index === alloc.month_index,
                );
                const monthLabel = installment
                  ? installment.label
                  : `Mes ${alloc.month_index}`;
                const remaining = installment
                  ? Number(installment.remaining)
                  : 0;
                const isPartial = remaining > 0;

                return (
                  <span
                    key={`${alloc.month_index}-${index}`}
                    className="receipt-allocation-chip"
                  >
                    {alloc.amount} {isPartial ? (
                      "pago parcial de "
                    ) : "pago correspondiente a "
                  }{monthLabel}</span>
                );
              })}
            </div>
          ) : null}

          {note ? (
            <p className="receipt-note">
              <span className="receipt-note-label">Nota:</span>
              <span className="receipt-note-text">{note}</span>
            </p>
          ) : null}

          <div className="receipt-payment-id">
            <span className="receipt-id-label">ID de Pago:</span>
            <span className="receipt-id-value">{paymentId}</span>
          </div>

          <div className="receipt-footer">
            <p className="receipt-thank-you">
              Gracias por su pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}