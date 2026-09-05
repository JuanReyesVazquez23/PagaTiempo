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

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
  sobrepago: "Sobrepago",
};

export function MonthGrid({ months, currency = "DOP" }: Props) {
  return (
    <ol className="month-grid" aria-label="Cuotas de diez meses">
      {months.map((month) => (
        <li key={month.month_index} className={`month-card status-${month.status}`}>
          <span className="month-index">Mes {month.month_index}</span>
          <strong>{month.label}</strong>
          <span className="month-status">{STATUS_LABEL[month.status] ?? month.status}</span>
          <span>
            Pagado {month.paid_amount} / {month.expected_amount} {currency}
          </span>
        </li>
      ))}
    </ol>
  );
}
