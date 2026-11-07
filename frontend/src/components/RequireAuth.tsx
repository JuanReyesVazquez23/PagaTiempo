import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe, type Role } from "../lib/api";

interface Props {
  children: (role: Role) => ReactNode;
}

/**
 * Puerta de autenticación del panel.
 *
 * El backend ya protege todos los datos, pero sin esta comprobación el
 * formulario/estructura del panel se renderiza al abrir /panel directamente.
 * Aquí verificamos la sesión contra la API antes de montar el panel y
 * redirigimos al login si no es válida.
 */
export function RequireAuth({ children }: Props) {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let active = true;

    fetchMe()
      .then((data) => {
        if (active) setRole(data.role);
      })
      .catch(() => {
        if (active) navigate("/", { replace: true });
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (!role) {
    return (
      <main className="shell">
        <div className="checking-session" role="status" aria-live="polite">
          <div className="checking-spinner" aria-hidden="true" />
          <p>Verificando sesión…</p>
        </div>
      </main>
    );
  }

  return <>{children(role)}</>;
}
