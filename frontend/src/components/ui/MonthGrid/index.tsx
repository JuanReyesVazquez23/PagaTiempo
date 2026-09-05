export interface MonthCell {
  month_index: number;
  label: string;
  expected_amount: string;
  paid_amount: string;
  remaining: string;
  status: string;
}

interface Props {
  months: MonthCell[];
  currency?: string;
}

const STATUS_META: Record<string, { label: string; icon: string }> = {
  pendiente: { label: "Pendiente", icon: "○" },
  parcial: { label: "Parcial", icon: "◐" },
  pagado: { label: "Pagado", icon: "✓" },
  sobrepago: { label: "Sobrepago", icon: "★" },
};

export function MonthGrid({ months, currency = "DOP" }: Props) {
  return (
    <section className="panel month-grid-panel" aria-labelledby="installments-heading">
      <div className="panel-header">
        <h2 id="installments-heading" className="panel-title">
          Ciclo de 10 Cuotas
        </h2>
        <span className="badge-meta">Año Escolar 2026–2027</span>
      </div>
      <ol className="month-grid" aria-label="Cuotas de diez meses">
        {months.map((month) => {
          const meta = STATUS_META[month.status] ?? { label: month.status, icon: "•" };
          const paid = parseFloat(month.paid_amount) || 0;
          const expected = parseFloat(month.expected_amount) || 0;
          const percent = expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : 0;

          return (
            <li key={month.month_index} className={`month-card status-${month.status}`}>
              <div className="month-card-header">
                <span className="month-index">Mes {month.month_index}</span>
                <span className={`month-status-pill pill-${month.status}`}>
                  <span aria-hidden="true">{meta.icon}</span> {meta.label}
                </span>
              </div>
              <strong className="month-label">{month.label}</strong>
              <div className="month-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="month-meter-bar" style={{ width: `${percent}%` }} />
              </div>
              <div className="month-amount">
                <span className="amount-label">Pagado</span>
                <span className="amount-val">
                  ${month.paid_amount} <small>/ ${month.expected_amount} {currency}</small>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
