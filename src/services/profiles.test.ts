import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import * as profileApi from "./profiles";
import * as authModule from "./auth";
import * as apiKeyModule from "./apiKey";
import { API } from "../api/constants";

describe("Profile API", () => {
  // Mock headers to be used in tests
  const mockHeaders = {
    Authorization: "Bearer token",
    "X-Noroff-API-Key": "mock-api-key",
    "Content-Type": "application/json",
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiKeyModule, "authHeaders").mockResolvedValue(mockHeaders);
    vi.spyOn(authModule, "getCurrentUser").mockReturnValue({ name: "Alice" });
  });

  // Clear all mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test for getProfile function
  it("getProfile returns profile data", async () => {
    const mockData = { data: { name: "Alice", bio: "Hello" } };

    // Use globalThis instead of global
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await profileApi.getProfile("Alice");
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auction/profiles/Alice?_listings=true&_wins=true`,
      { headers: mockHeaders },
    );
    expect(result).toEqual(mockData.data);
  });

  it("updateProfile throws if user not logged in", async () => {
    vi.spyOn(authModule, "getCurrentUser").mockReturnValue(null);
    await expect(profileApi.updateProfile({ bio: "Hi" })).rejects.toThrow(
      "User not logged in",
    );
  });

  it("getProfileListings returns listings", async () => {
    const mockListings = { data: [{ id: 1 }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockListings,
    } as Response);

    const listings = await profileApi.getProfileListings("Alice");
    expect(listings).toEqual(mockListings.data);
  });

  // Test for getProfileBids function
  it("getProfileBids returns bids with optional listings", async () => {
    const mockBids = { data: [{ id: 1, amount: 100 }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBids,
    } as Response);

    const bids = await profileApi.getProfileBids("Alice");
    expect(bids).toEqual(mockBids.data);
  });
});
