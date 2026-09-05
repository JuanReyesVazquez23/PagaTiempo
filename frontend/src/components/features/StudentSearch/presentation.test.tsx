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
          { id: "1", full_name: "Juan Pérez", total_paid: "0.00", total_expected: "5000.00" },
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
});
