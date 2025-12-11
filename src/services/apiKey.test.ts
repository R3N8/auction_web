import { describe, it, expect, beforeEach, vi } from "vitest";
import * as apiKeyModule from "../../src/services/apiKey";
import * as storage from "../../src/utils/storage";
import { API } from "../../src/api/constants";
import type { Mock } from "vitest";

describe("API Key", () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn() as Mock);
    vi.spyOn(storage, "save").mockImplementation(() => {});
    vi.spyOn(storage, "load").mockImplementation((key: string) => {
      if (key === "user") return { accessToken: "abc123" };
      return null;
    });
  });

  // Test getApiKey function
  it("getApiKey returns saved key if exists", async () => {
    vi.spyOn(storage, "load").mockReturnValueOnce("saved-key");
    const key = await apiKeyModule.getApiKey("abc123");
    expect(key).toBe("saved-key");
  });

  // Test fetching and saving new API key
  it("getApiKey fetches and saves new key if not exists", async () => {
    const fetchMock = fetch as unknown as Mock;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { key: "new-key" } }),
    });

    const key = await apiKeyModule.getApiKey("abc123");
    expect(key).toBe("new-key");
    expect(storage.save).toHaveBeenCalledWith("apiKey", "new-key");
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auth/create-api-key`,
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer abc123" },
      }),
    );
  });

  // Test authHeaders function
  it("authHeaders returns correct headers", async () => {
    vi.spyOn(storage, "load").mockImplementation((key: string) => {
      if (key === "user") return { accessToken: "abc123" };
      if (key === "apiKey") return "api-key";
      return null;
    });

    const headers = await apiKeyModule.authHeaders();
    expect(headers).toEqual({
      Authorization: "Bearer abc123",
      "X-Noroff-API-Key": "api-key",
      "Content-Type": "application/json",
    });
  });

  // Test authHeaders error handling
  it("authHeaders throws if user or apiKey missing", async () => {
    vi.spyOn(storage, "load").mockReturnValue(null);
    await expect(apiKeyModule.authHeaders()).rejects.toThrow(
      "User not logged in or missing API key",
    );
  });
});
