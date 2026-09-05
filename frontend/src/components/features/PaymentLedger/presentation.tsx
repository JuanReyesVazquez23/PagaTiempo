import { useFormStatus } from "react-dom";

import type { Payment, StudentDetail } from "../../../lib/api";

export interface PaymentLedgerPresentationProps {
  student: StudentDetail;
  error: string | null;
  success: string | null;
  onSubmit: (formData: FormData) => void | Promise<void>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Registrar pago"}
    </button>
  );
}

function formatStamp(value: string): string {
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function HistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p>Sin movimientos todavía.</p>;
  }
  return (
    <ol className="history">
      {payments.map((payment) => (
        <li key={payment.id}>
          <div>
            <strong>{payment.amount}</strong>
            <time dateTime={payment.recorded_at}>{formatStamp(payment.recorded_at)}</time>
          </div>
          {payment.note ? <p>{payment.note}</p> : null}
          <p className="hint">
            Aplicado a{" "}
            {payment.allocations.map((item) => `mes ${item.month_index} (${item.amount})`).join(", ")}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function PaymentLedgerPresentation({ student, error, success, onSubmit }: PaymentLedgerPresentationProps) {
  return (
    <section className="panel" aria-labelledby="pay-heading">
      <h2 id="pay-heading">Registrar pago — {student.full_name}</h2>
      <p>
        Acumulado {student.total_paid} de {student.total_expected}
      </p>
      <form action={onSubmit} className="pay-form">
        <div className="field">
          <label htmlFor="amount">Importe</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
        </div>
        <div className="field">
          <label htmlFor="month_index">Mes (opcional)</label>
          <select id="month_index" name="month_index" defaultValue="">
            <option value="">Automático (primer mes con saldo)</option>
            {student.installments.map((month) => (
              <option key={month.id} value={month.month_index}>
                Mes {month.month_index} · {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="note">Nota</label>
          <input id="note" name="note" type="text" maxLength={500} />
        </div>
        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="success" role="status">
            {success}
          </p>
        ) : null}
        <SubmitButton />
      </form>
      <h3>Historial</h3>
      <HistoryList payments={student.payments} />
    </section>
  );
}
