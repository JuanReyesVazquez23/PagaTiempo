import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, login } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pin = String(data.get("pin") ?? "");
    setError(null);
    try {
      await login(pin);
      navigate("/panel");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo iniciar sesión");
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Tesorera · ciclo 10 meses</p>
        <h1>PagaTiempo</h1>
        <p>Anota cuotas sin mezclar historiales.</p>
      </header>
      <form className="panel login-card" onSubmit={onSubmit}>
        <label htmlFor="pin">PIN de tesorera</label>
        <input id="pin" name="pin" type="password" autoComplete="current-password" minLength={4} required />
        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
