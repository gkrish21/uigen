/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { jwtVerify } from "jose";
import { TextEncoder } from "util";

// Mock server-only to prevent errors in test environment
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Import after mocking
import { cookies } from "next/headers";
import { createSession } from "../auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);
const COOKIE_NAME = "auth-token";

describe("createSession", () => {
  let mockCookieStore: any;

  beforeEach(() => {
    mockCookieStore = {
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a session with valid JWT token", async () => {
    const userId = "user123";
    const email = "test@example.com";

    await createSession(userId, email);

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];

    expect(cookieName).toBe(COOKIE_NAME);
    expect(typeof token).toBe("string");
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(options.expires).toBeInstanceOf(Date);
  });

  it("sets secure flag in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await createSession("user123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.secure).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  it("does not set secure flag in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    await createSession("user123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.secure).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });

  it("creates token with correct payload", async () => {
    const userId = "user123";
    const email = "test@example.com";

    await createSession(userId, email);

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe(userId);
    expect(payload.email).toBe(email);
    expect(payload.expiresAt).toBeDefined();
  });

  it("sets expiration to 7 days", async () => {
    const beforeTime = Date.now();
    await createSession("user123", "test@example.com");
    const afterTime = Date.now();

    const options = mockCookieStore.set.mock.calls[0][2];
    const expiresTime = options.expires.getTime();

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiresTime).toBeGreaterThanOrEqual(beforeTime + sevenDaysMs);
    expect(expiresTime).toBeLessThanOrEqual(afterTime + sevenDaysMs);
  });

  it("sets cookie path to root", async () => {
    await createSession("user123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.path).toBe("/");
  });

  it("sets httpOnly flag to true", async () => {
    await createSession("user123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
  });

  it("sets sameSite to lax", async () => {
    await createSession("user123", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.sameSite).toBe("lax");
  });

  it("handles empty string userId", async () => {
    await createSession("", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("");
  });

  it("handles empty string email", async () => {
    await createSession("user123", "");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.email).toBe("");
  });

  it("handles special characters in userId", async () => {
    const specialUserId = "user@#$%^&*()123";
    await createSession(specialUserId, "test@example.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe(specialUserId);
  });

  it("handles very long userId", async () => {
    const longUserId = "a".repeat(1000);
    await createSession(longUserId, "test@example.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe(longUserId);
  });

  it("handles Unicode characters in email", async () => {
    const unicodeEmail = "用户@example.com";
    await createSession("user123", unicodeEmail);

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.email).toBe(unicodeEmail);
  });

  it("creates unique tokens for different users", async () => {
    await createSession("user1", "user1@example.com");
    const token1 = mockCookieStore.set.mock.calls[0][1];

    await createSession("user2", "user2@example.com");
    const token2 = mockCookieStore.set.mock.calls[1][1];

    expect(token1).not.toBe(token2);
  });

  it("token includes JWT structure", async () => {
    await createSession("user123", "test@example.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    // JWT tokens have 3 parts separated by dots
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

});
