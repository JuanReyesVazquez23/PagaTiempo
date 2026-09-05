// URL base de la API. Vacía por defecto: en desarrollo el proxy de Vite
// reenvía /api a localhost:8000, y en producción funciona si el frontend
// y el backend comparten dominio. Si el frontend vive en un dominio
// distinto (p. ej. Vercel) y el backend en otro (p. ej. Railway), define
// VITE_API_BASE_URL en Vercel con la URL completa del backend.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export interface StudentSummary {
  id: string;
  full_name: string;
  total_paid: string;
  total_expected: string;
}

export interface Installment {
  id: string;
  month_index: number;
  period_start: string;
  label: string;
  expected_amount: string;
  paid_amount: string;
  remaining: string;
  status: "pendiente" | "parcial" | "pagado" | "sobrepago";
}

export interface Payment {
  id: string;
  amount: string;
  note: string | null;
  recorded_at: string;
  allocations: Array<{ installment_id: string; month_index: number; amount: string }>;
}

export interface StudentDetail {
  id: string;
  full_name: string;
  total_paid: string;
  total_expected: string;
  installments: Installment[];
  payments: Payment[];
}

export interface CycleInfo {
  start: string;
  months: number;
  monthly_quota: string;
  currency: string;
  labels: string[];
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body: { detail?: string } = await response.json();
    return body.detail ?? "Error del servidor";
  } catch {
    return "Error del servidor";
  }
}

export async function login(pin: string): Promise<void> {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function logout(): Promise<void> {
  await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
}

export async function fetchMe(): Promise<{ role: string; student_count: number }> {
  const response = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
  if (!response.ok) {
    throw new ApiError("No autenticada", response.status);
  }
  return response.json();
}

export async function fetchStudents(query: string): Promise<StudentSummary[]> {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }
  const suffix = params.size ? `?${params.toString()}` : "";
  const response = await fetch(apiUrl(`/api/students${suffix}`), { credentials: "include" });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export async function fetchStudent(id: string): Promise<StudentDetail> {
  const response = await fetch(apiUrl(`/api/students/${id}`), { credentials: "include" });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export async function createPayment(
  studentId: string,
  payload: { amount: string; month_index: number | null; note: string },
): Promise<StudentDetail> {
  const response = await fetch(apiUrl(`/api/students/${studentId}/payments`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      month_index: payload.month_index,
      note: payload.note || null,
    }),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export function formatMoney(value: string, currency = "DOP"): string {
  const amount = Number(value);
  return new Intl.NumberFormat("es-DO", { style: "currency", currency }).format(amount);
}
