import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, adminLogin, login } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showAdminKey, setShowAdminKey] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pin = String(data.get("pin") ?? "");
    const adminKey = String(data.get("adminKey") ?? "");
    setError(null);
    try {
      if (adminKey) {
        await adminLogin(adminKey);
      } else {
        await login(pin);
      }
      navigate("/panel");
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError ? cause.message : "Clave incorrecta"
      );
    }
  }

  return (
    <main className="shell login-shell">
      <div className="login-wrapper">
        <header className="hero login-hero">
          <div className="login-brand-pill">
            <span className="brand-badge" aria-hidden="true">PT</span>
            <span className="eyebrow">
              {showAdminKey ? "Administrador" : "Tesorera"} · Ciclo 10 meses
            </span>
          </div>
          <h1>PagaTiempo</h1>
          <p className="login-tagline">
            Gestión ordenada de cuotas escolares. Registro ágil e historiales individuales por estudiante.
          </p>
        </header>

        <form className="panel login-card" onSubmit={onSubmit}>
          <div className="card-header">
            <div className="lock-icon" aria-hidden="true">🔐</div>
            <div>
              <h2 className="login-card-title">Acceso al Panel</h2>
              {showAdminKey
                ? (
                  <p className="hint">Ingresa la clave maestra de administrador (ADMIN_KEY)</p>
                )
                : (
                  <p className="hint">Ingresa tu PIN de seguridad para continuar</p>
                )}
            </div>
          </div>

          <div className="field">
            {showAdminKey ? (
              <>
                <label htmlFor="admin-key">Clave de Administrador</label>
                <input
                  id="admin-key"
                  name="adminKey"
                  type="password"
                  autoComplete="current-password"
                  minLength={4}
                  required
                  placeholder="••••••••"
                  className="neu-input pin-input"
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {error ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary login-btn">
            {showAdminKey ? "Entrar como Administrador" : "Entrar al Libro de Cuotas"} →
          </button>

          {showAdminKey ? null : (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowAdminKey(true)}
              title="Acceder con clave de administrador"
            >
              Modo Admin ⚙️
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
