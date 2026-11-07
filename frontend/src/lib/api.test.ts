import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTH_EXPIRED_EVENT, fetchMe, fetchStudents } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("envía la cabecera anti-CSRF y no usa caché", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("[]", { status: 200 }));

    await fetchStudents("");

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const init = call?.[1];
    const headers = init?.headers as Headers;

    expect(headers.get("X-Requested-With")).toBe("XMLHttpRequest");
    expect(init?.credentials).toBe("include");
    expect(init?.cache).toBe("no-store");
  });

  it("dispara el evento de sesión expirada ante un 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Sesión requerida" }), { status: 401 }),
    );
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    await expect(fetchStudents("")).rejects.toThrow();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it("no dispara el evento para el chequeo de sesión", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    await expect(fetchMe()).rejects.toThrow();

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
