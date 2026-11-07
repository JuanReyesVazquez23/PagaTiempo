import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentSearchPresentation } from "./presentation";

describe("StudentSearchPresentation", () => {
  it("lists example students", () => {
    render(
      <StudentSearchPresentation
        query=""
        deferredQuery=""
        loading={false}
        error={null}
        students={[
          { id: "1", full_name: "Juan Pérez", total_paid: "0.00", total_expected: "5200.00" },
        ]}
        onQueryChange={() => undefined}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText("Juan Pérez")).toBeTruthy();
  });

  it("shows '+ Nuevo' button in admin mode and triggers callback", () => {
    let clicked = false;
    render(
      <StudentSearchPresentation
        query=""
        deferredQuery=""
        loading={false}
        error={null}
        isAdmin={true}
        onNewStudent={() => {
          clicked = true;
        }}
        students={[]}
        onQueryChange={() => undefined}
        onSelect={() => undefined}
      />,
    );
    const button = screen.getByRole("button", { name: /\+ nuevo/i });
    expect(button).toBeTruthy();
    button.click();
    expect(clicked).toBe(true);
  });

  it("shows delete button (✕) for each student in admin mode", () => {
    render(
      <StudentSearchPresentation
        query=""
        deferredQuery=""
        loading={false}
        error={null}
        isAdmin={true}
        onDeleteStudent={() => undefined}
        students={[
          { id: "1", full_name: "Juan Pérez", total_paid: "0.00", total_expected: "5200.00" },
          { id: "2", full_name: "Ana García", total_paid: "100.00", total_expected: "5200.00" },
        ]}
        onQueryChange={() => undefined}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /eliminar a juan pérez/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /eliminar a ana garcía/i })).toBeTruthy();
  });

  it("does NOT show delete button in non-admin mode", () => {
    render(
      <StudentSearchPresentation
        query=""
        deferredQuery=""
        loading={false}
        error={null}
        isAdmin={false}
        students={[
          { id: "1", full_name: "Juan Pérez", total_paid: "0.00", total_expected: "5200.00" },
        ]}
        onQueryChange={() => undefined}
        onSelect={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /eliminar a juan pérez/i })).toBeNull();
  });

  it("calls onDeleteStudent with id and name when delete button is clicked", () => {
    let deletedId = "";
    let deletedName = "";
    render(
      <StudentSearchPresentation
        query=""
        deferredQuery=""
        loading={false}
        error={null}
        isAdmin={true}
        onDeleteStudent={(id, name) => {
          deletedId = id;
          deletedName = name;
        }}
        students={[
          { id: "42", full_name: "Pedro López", total_paid: "0.00", total_expected: "5200.00" },
        ]}
        onQueryChange={() => undefined}
        onSelect={() => undefined}
      />,
    );
    const btn = screen.getByRole("button", { name: /eliminar a pedro lópez/i });
    btn.click();
    expect(deletedId).toBe("42");
    expect(deletedName).toBe("Pedro López");
  });
});
