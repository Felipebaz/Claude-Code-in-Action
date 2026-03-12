// @vitest-environment node
import { vi, test, expect, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const secret = "development-secret-key";
const JWT_SECRET = Uint8Array.from(Buffer.from(secret));

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie with a JWT", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];

  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");

  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets cookie expiration to 7 days", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();

  await createSession("user-1", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expires = new Date(options.expires).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expires).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expires).toBeLessThanOrEqual(Date.now() + sevenDays + 1000);
});

test("createSession sets secure flag only in production", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(false);
});
