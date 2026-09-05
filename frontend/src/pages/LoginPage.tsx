import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, adminLogin, login } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"treasurer" | "admin">("treasurer");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    try {
      if (mode === "admin") {
        const password = String(data.get("password") ?? "");
        await adminLogin(password);
      } else {
        const pin = String(data.get("pin") ?? "");
        await login(pin);
      }
      navigate("/panel");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo iniciar sesión");
    }
  }

  return (
    <main className="shell login-shell">
      <div className="login-wrapper">
        <header className="hero login-hero">
          <div className="login-brand-pill">
            <span className="brand-badge" aria-hidden="true">PT</span>
            <span className="eyebrow">Tesorera · Ciclo 10 meses</span>
          </div>
          <h1>PagaTiempo</h1>
          <p className="login-tagline">
            Gestión ordenada de cuotas escolares. Registro ágil e historiales individuales por estudiante.
          </p>
        </header>

        <form className="panel login-card" onSubmit={onSubmit}>
          <div className="login-tabs" role="tablist" aria-label="Modo de acceso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "treasurer"}
              className={`login-tab-btn ${mode === "treasurer" ? "is-active" : ""}`}
              onClick={() => {
                setMode("treasurer");
                setError(null);
              }}
            >
              👩‍💼 Tesorera
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "admin"}
              className={`login-tab-btn ${mode === "admin" ? "is-active" : ""}`}
              onClick={() => {
                setMode("admin");
                setError(null);
              }}
            >
              👑 Administrador
            </button>
          </div>

          <div className="card-header">
            <div className="lock-icon" aria-hidden="true">
              {mode === "admin" ? "👑" : "🔐"}
            </div>
            <div>
              <h2 className="login-card-title">
                {mode === "admin" ? "Modo Administrador" : "Acceso al Panel"}
              </h2>
              <p className="hint">
                {mode === "admin"
                  ? "Ingresa la contraseña maestra configurada en Vercel"
                  : "Ingresa tu PIN de seguridad para continuar"}
              </p>
            </div>
          </div>

          {mode === "admin" ? (
            <div className="field">
              <label htmlFor="admin-password">Contraseña de Administrador</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="neu-input pin-input"
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="pin">PIN de tesorera</label>
              <input
                id="pin"
                name="pin"
                type="password"
                autoComplete="current-password"
                minLength={4}
                required
                placeholder="••••"
                className="neu-input pin-input"
              />
            </div>
          )}

          {error ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary login-btn">
            {mode === "admin" ? "Entrar como Administrador →" : "Entrar al Libro de Cuotas →"}
          </button>
        </form>
      </div>
    </main>
  );
}
