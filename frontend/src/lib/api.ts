// URL base de la API. Vacía por defecto: en desarrollo el proxy de Vite
// reenvía /api a localhost:8000, y en producción funciona si el frontend
// y el backend comparten dominio (incluido el proxy same-origin de
// frontend/vercel.json, que es el caso recomendado cuando frontend y
// backend son proyectos distintos en Vercel: ver ese archivo). Dejarla
// vacía en ese caso es intencional y necesario para que el login
// funcione en Safari/iOS, que bloquea la cookie de sesión si queda "de
// terceros".
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export type Role = "treasurer" | "admin";

/** Evento global: la sesión expiró o dejó de ser válida. */
export const AUTH_EXPIRED_EVENT = "pagatiempo:auth-expired";

// Los endpoints de autenticación pueden devolver 401 de forma legítima
// (credenciales incorrectas) sin que eso signifique que la sesión expiró.
const AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/admin-login",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/downgrade",
]);

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-Requested-With", "XMLHttpRequest");

  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  const pathname = path.split("?")[0] ?? path;
  if (response.status === 401 && !AUTH_PATHS.has(pathname)) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  return response;
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
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function adminLogin(password: string): Promise<void> {
  const response = await apiFetch("/api/auth/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function exitAdminMode(): Promise<void> {
  const response = await apiFetch("/api/auth/downgrade", { method: "POST" });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<{ role: Role; student_count: number }> {
  const response = await apiFetch("/api/auth/me");
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
  const response = await apiFetch(`/api/students${suffix}`);
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export async function fetchStudent(id: string): Promise<StudentDetail> {
  const response = await apiFetch(`/api/students/${id}`);
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export async function createPayment(
  studentId: string,
  payload: { amount: string; month_index: number | null; note: string },
): Promise<StudentDetail> {
  const response = await apiFetch(`/api/students/${studentId}/payments`, {
    method: "POST",
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

export async function createStudent(fullName: string): Promise<StudentDetail> {
  const response = await apiFetch("/api/admin/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName }),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export async function deleteStudent(studentId: string): Promise<void> {
  const response = await apiFetch(`/api/admin/students/${studentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export async function resetStudentAccount(studentId: string): Promise<StudentDetail> {
  const response = await apiFetch(`/api/admin/students/${studentId}/reset`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json();
}

export async function resetAllAccounts(): Promise<void> {
  const response = await apiFetch("/api/admin/reset-all", { method: "POST" });
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
}

export function formatMoney(value: string, currency = "DOP"): string {
  const amount = Number(value);
  return new Intl.NumberFormat("es-DO", { style: "currency", currency }).format(amount);
}
