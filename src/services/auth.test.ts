import { describe, it, expect, beforeEach, vi } from "vitest";
import * as authModule from "../../src/services/auth";
import * as apiKeyModule from "../../src/services/apiKey";
import * as storage from "../../src/utils/storage";
import { API } from "../../src/api/constants";
import type { Mock } from "vitest";

describe("Auth API", () => {
  // Mock data
  const mockUser = { name: "Alice", accessToken: "abc123" };
  const mockApiKey = "mock-api-key";
  let fetchMock: Mock;

  // Reset mocks before each test
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(storage, "save").mockImplementation(() => {});
    vi.spyOn(storage, "load").mockImplementation((key: string) => {
      if (key === "user") return mockUser;
      if (key === "apiKey") return mockApiKey;
      return null;
    });
  });

  // Tests
  it("login calls API and saves user + API key", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockUser }),
    });

    vi.spyOn(apiKeyModule, "getApiKey").mockResolvedValueOnce(mockApiKey);

    const result = await authModule.login({
      email: "test@example.com",
      password: "123456",
    });
    expect(result).toEqual(mockUser);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/auth/login`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "123456" }),
      }),
    );
    expect(storage.save).toHaveBeenCalledWith("user", mockUser);
    expect(storage.save).toHaveBeenCalledWith("apiKey", mockApiKey);
  });

  it("login throws error if fetch fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [{ message: "Invalid credentials" }] }),
    });

    await expect(
      authModule.login({ email: "test@example.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("register calls API and returns user", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockUser }),
    });

    const result = await authModule.register({
      name: "Alice",
      email: "a@test.com",
      password: "123456",
    });
    expect(result).toEqual(mockUser);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/auth/register`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alice",
          email: "a@test.com",
          password: "123456",
        }),
      }),
    );
  });

  it("register throws error if fetch fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [{ message: "Email taken" }] }),
    });

    await expect(
      authModule.register({ name: "A", email: "a@test.com", password: "x" }),
    ).rejects.toThrow("Email taken");
  });

  it("logout clears user from localStorage and resets hash", () => {
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem");

    window.location.hash = "#/profile";

    authModule.logout();

    expect(removeSpy).toHaveBeenCalledWith("user");
    expect(window.location.hash).toBe("#/");
  });

  it("getCurrentUser returns loaded user", () => {
    const user = authModule.getCurrentUser();
    expect(user).toEqual(mockUser);
  });
});
