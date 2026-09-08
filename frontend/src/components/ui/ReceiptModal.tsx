import { useEffect } from "react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  amount: string;
  date: string;
  note: string | null;
  paymentId: string;
  allocations: Array<{ month_index: number; amount: string }>;
  installments: Array<{ month_index: number; label: string; expected_amount: string }>;
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
            Recibo de Transaccion
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
          <div className="receipt-content">
            <div className="receipt-header">
              <span className="receipt-institution">PagaTiempo </span>
              <span className="receipt-date">{new Date(date).toLocaleDateString(
                "es-DO",
              )}</span>
            </div>

            <div className="receipt-student-info">
              <strong>Estudiante:</strong> {studentName}
            </div>

            <div className="receipt-divider" />

            <div className="receipt-amount">
              <span className="receipt-amount-label">Monto</span>
              <span className="receipt-amount-value">{formattedAmount}</span>
            </div>

            {allocations.length > 0 ? (
              <div className="receipt-allocation">
                <span className="receipt-allocation-label">Detalle de asignación:</span>
{allocations.map((alloc) => {
                  const installment = installments.find(
                    (inst) => inst.month_index === alloc.month_index,
                  );
                  const expected = installment ? parseFloat(installment.expected_amount) : 0;
                  const paid = parseFloat(alloc.amount);
                  // Full payment: allocated amount covers or exceeds expected amount
                  // Partial payment: allocated amount is less than expected
                  const isFullPayment = !installment || paid >= expected;
                  const monthLabel = installment ? installment.label : `Mes ${alloc.month_index}`;

                  if (isFullPayment) {
                    return (
                      <span key={alloc.month_index} className="receipt-allocation-chip">
                        {alloc.amount} pago correspondientes al {monthLabel}
                      </span>
                    );
                  }
                  return (
                    <span key={alloc.month_index} className="receipt-allocation-chip">
                      {alloc.amount} pago parcial correspondiente a {monthLabel}
                    </span>
                  );
                })}
              </div>
            ) : null}

            {note ? (
              <div className="receipt-note">
                <span className="receipt-note-label">Nota:</span>
                <span className="receipt-note-text">{note}</span>
              </div>
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
    </div>
  );
}