import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, adminLogin } from "../lib/api";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    setError(null);
    setLoading(true);
    try {
      await adminLogin(password);
      navigate("/panel");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Contraseña incorrecta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell login-shell">
      <div className="login-wrapper">
        <header className="hero login-hero">
          <div className="login-brand-pill">
            <span className="brand-badge" aria-hidden="true">PT</span>
            <span className="eyebrow">Gestión Central · Modo Admin</span>
          </div>
          <h1>PagaTiempo</h1>
          <p className="login-tagline">
            Consola de administración: gestión de ciclo, creación de estudiantes y limpieza de cuentas.
          </p>
        </header>

        <form className="panel login-card" onSubmit={onSubmit}>
          <div className="card-header">
            <div className="lock-icon" aria-hidden="true">👑</div>
            <div>
              <h2 className="login-card-title">Acceso de Administrador</h2>
              <p className="hint">Ingresa la clave maestra definida en la variable de entorno ADMIN_KEY en Vercel</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="admin-password">Contraseña de Administrador</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              placeholder="••••••••"
              className="neu-input pin-input"
            />
          </div>

          {error ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? "Verificando…" : "Entrar como Administrador →"}
          </button>
        </form>
      </div>
    </main>
  );
}
