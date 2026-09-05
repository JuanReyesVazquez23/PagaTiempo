import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, login, adminLogin } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [clicks, setClicks] = useState(0);
  const [showAdminKey, setShowAdminKey] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      setClicks((c) => {
        if (c >= 9) {
          setShowAdminKey(true);
          return 0;
        }
        return c + 1;
      });
    };
    const brandBadge = document.querySelector(".brand-badge");
    if (brandBadge) {
      brandBadge.addEventListener("click", handleClick);
    }
    return () => {
      const brandBadge2 = document.querySelector(".brand-badge");
      if (brandBadge2) {
        brandBadge2.removeEventListener("click", handleClick);
      }
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pin = String(data.get("pin") ?? "");
    const adminKey = String(data.get("adminKey") ?? "");
    setError(null);
    try {
      if (showAdminKey && adminKey) {
        await adminLogin(adminKey);
      } else if (pin) {
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
                  <p className="hint">10 clics en el logo PT = Modo Administrador. Ingresa la clave ADMIN_KEY</p>
                )
                : (
                  <p className="hint">Ingresa tu PIN de seguridad para continuar</p>
                )}
            </div>
          </div>

          <div className="field">
            {showAdminKey ? (
              <>
                <label htmlFor="admin-key">Clave de Acceso</label>
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
              title="Dar 10 clics en el logo PT para activar modo admin"
            >
              {clicks < 10 ? `${10 - clicks} clics más` : "Modo admin activo"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
