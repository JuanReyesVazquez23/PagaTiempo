import { useFormStatus } from "react-dom";

import type { Payment, StudentDetail } from "../../../lib/api";

export interface PaymentLedgerPresentationProps {
  student: StudentDetail;
  error: string | null;
  success: string | null;
  isAdmin?: boolean;
  onResetStudent?: () => void;
  onDeleteStudent?: () => void;
  onSubmit: (formData: FormData) => void | Promise<void>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>Guardando pago…</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">💳</span>
          <span>Registrar pago</span>
        </>
      )}
    </button>
  );
}

function formatStamp(value: string): string {
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function HistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="empty-history">
        <p className="hint">Sin movimientos registrados todavía.</p>
      </div>
    );
  }
  return (
    <ol className="history" aria-label="Historial de pagos">
      {payments.map((payment) => (
        <li key={payment.id} className="history-item">
          <div className="history-header">
            <span className="history-amount">${payment.amount} <small>DOP</small></span>
            <time className="history-time" dateTime={payment.recorded_at}>
              {formatStamp(payment.recorded_at)}
            </time>
          </div>
          {payment.note ? <p className="history-note">{payment.note}</p> : null}
          <div className="history-allocations">
            <span className="allocations-label">Aplicado a:</span>
            <div className="allocations-chips">
              {payment.allocations.map((item) => (
                <span key={item.month_index} className="allocation-chip">
                  Mes {item.month_index} (${item.amount})
                </span>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PaymentLedgerPresentation({
  student,
  error,
  success,
  isAdmin,
  onResetStudent,
  onDeleteStudent,
  onSubmit,
}: PaymentLedgerPresentationProps) {
  const paidVal = parseFloat(student.total_paid) || 0;
  const expectedVal = parseFloat(student.total_expected) || 0;
  const remainingVal = Math.max(0, expectedVal - paidVal);
  const percentVal = expectedVal > 0 ? Math.min(100, Math.round((paidVal / expectedVal) * 100)) : 0;

  return (
    <section className="panel ledger-panel" aria-labelledby="pay-heading">
      <div className="ledger-student-card">
        <div className="student-header-title">
          <div>
            <span className="badge-meta">Ficha del Estudiante</span>
            <h2 id="pay-heading">{student.full_name}</h2>
          </div>
          <div className="student-header-actions">
            <span className={`status-badge-overall ${percentVal >= 100 ? "status-complete" : "status-active"}`}>
              {percentVal >= 100 ? "✓ Al día" : `Pendiente ${percentVal}%`}
            </span>
            {isAdmin ? (
              <div className="admin-student-btn-group">
                <button
                  type="button"
                  className="btn-ghost btn-xs btn-warn"
                  onClick={onResetStudent}
                  title="Limpiar cuenta del estudiante (borra sus pagos)"
                >
                  ↺ Limpiar cuenta
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-xs btn-danger"
                  onClick={onDeleteStudent}
                  title="Eliminar este estudiante del sistema"
                >
                  🗑️ Eliminar
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="student-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Total Pagado</span>
            <span className="metric-value">${student.total_paid}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Total Esperado</span>
            <span className="metric-value">${student.total_expected}</span>
          </div>
          <div className="metric-box highlight">
            <span className="metric-label">Saldo Restante</span>
            <span className="metric-value">${remainingVal.toFixed(2)}</span>
          </div>
        </div>

        <div className="overall-meter-container">
          <div className="overall-meter-labels">
            <span>Progreso del ciclo (10 cuotas)</span>
            <strong>{percentVal}% cubierto</strong>
          </div>
          <div className="overall-meter" role="progressbar" aria-valuenow={percentVal} aria-valuemin={0} aria-valuemax={100}>
            <div className="overall-meter-fill" style={{ width: `${percentVal}%` }} />
          </div>
        </div>
      </div>

      <div className="ledger-columns">
        <div className="ledger-form-box">
          <h3 className="section-subtitle">Nuevo Pago</h3>
          <form action={onSubmit} className="pay-form">
            <div className="field">
              <label htmlFor="amount">Importe a abonar (DOP)</label>
              <div className="input-with-affix">
                <span className="input-affix" aria-hidden="true">RD$</span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="neu-input"
                />
              </div>
              <span className="field-hint">Se distribuirá automáticamente al primer mes con deuda pendiente.</span>
            </div>

            <div className="field">
              <label htmlFor="month_index">Asignar a mes específico (opcional)</label>
              <select id="month_index" name="month_index" defaultValue="" className="neu-select">
                <option value="">Automático (primer mes con saldo)</option>
                {student.installments.map((month) => (
                  <option key={month.id} value={month.month_index}>
                    Mes {month.month_index} · {month.label} (Resta: ${month.remaining})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="note">Nota o recibo (opcional)</label>
              <input
                id="note"
                name="note"
                type="text"
                maxLength={500}
                placeholder="Ej. Transferencia #1234 o pago en efectivo"
                className="neu-input"
              />
            </div>

            {error ? (
              <p className="alert" role="alert">
                <span aria-hidden="true">⚠️</span> {error}
              </p>
            ) : null}

            {success ? (
              <p className="success" role="status">
                <span aria-hidden="true">✓</span> {success}
              </p>
            ) : null}

            <SubmitButton />
          </form>
        </div>

        <div className="ledger-history-box">
          <div className="history-title-bar">
            <h3 className="section-subtitle">Historial de Transacciones</h3>
            <span className="badge-counter">{student.payments.length}</span>
          </div>
          <HistoryList payments={student.payments} />
        </div>
      </div>
    </section>
  );
}
