import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMe } from "../lib/api";
import { RequireAuth } from "./RequireAuth";

vi.mock("../lib/api", () => ({
  fetchMe: vi.fn(),
}));

const mockedFetchMe = vi.mocked(fetchMe);

function renderPanel() {
  return render(
    <MemoryRouter initialEntries={["/panel"]}>
      <Routes>
        <Route path="/" element={<div>Pantalla de login</div>} />
        <Route
          path="/panel"
          element={
            <RequireAuth>{(role) => <div>Panel de {role}</div>}</RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    mockedFetchMe.mockReset();
  });

  it("monta el panel sólo después de verificar la sesión", async () => {
    mockedFetchMe.mockResolvedValue({ role: "admin", student_count: 3 });

    renderPanel();

    expect(screen.getByText(/verificando sesión/i)).toBeTruthy();
    expect(await screen.findByText("Panel de admin")).toBeTruthy();
  });

  it("redirige al login cuando no hay sesión válida", async () => {
    mockedFetchMe.mockRejectedValue(new Error("401"));

    renderPanel();

    expect(await screen.findByText("Pantalla de login")).toBeTruthy();
    expect(screen.queryByText(/panel de/i)).toBeNull();
  });
});
