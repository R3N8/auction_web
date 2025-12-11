import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import * as listingsApi from "./listings";
import * as apiKeyModule from "../services/apiKey";
import * as storageModule from "../utils/storage";
import { API } from "../api/constants";

describe("Listings API", () => {
  // Mock headers to be returned by authHeaders
  const mockHeaders = {
    Authorization: "Bearer token",
    "X-Noroff-API-Key": "mock-api-key",
    "Content-Type": "application/json",
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn() as Mock);
    vi.spyOn(apiKeyModule, "authHeaders").mockResolvedValue(mockHeaders);
  });

  // Clear all mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test fetchListings returns data correctly
  it("fetchListings returns listings", async () => {
    const mockData = { data: [{ id: 1 }] };

    // Type-safe fetch mock
    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const listings = await listingsApi.fetchListings({ _seller: true });
    expect(listings).toEqual(mockData.data);
    expect(fetch).toHaveBeenCalledWith(`${API}/auction/listings?_seller=true`);
  });

  // Test createListing with user token
  it("createListing requires user token", async () => {
    vi.spyOn(storageModule, "load").mockReturnValue({ accessToken: "abc123" });
    const payload = {
      title: "Test",
      description: "desc",
      endsAt: "2025-01-01",
    };
    const mockResp = { data: { id: 1 } };

    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResp,
    } as Response);

    const listing = await listingsApi.createListing(payload);
    expect(listing).toEqual(mockResp.data);
  });

  // Test updateListing calls correct endpoint
  it("updateListing calls correct endpoint", async () => {
    const payload = { title: "Updated" };
    const mockResp = { data: { id: 1 } };

    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResp,
    } as Response);

    const result = await listingsApi.updateListing("1", payload);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auction/listings/1`,
      expect.objectContaining({
        method: "PUT",
        headers: mockHeaders,
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual(mockResp.data);
  });

  // Test deleteListing handles 204 response
  it("deleteListing returns true on 204", async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({
      status: 204,
    } as Response);

    const result = await listingsApi.deleteListing("1");
    expect(result).toBe(true);
  });

  // Test placeBid sends correct data
  it("placeBid returns data", async () => {
    const mockResp = { data: { id: 1, amount: 100 } };

    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResp,
    } as Response);

    const bid = await listingsApi.placeBid("1", 100);
    expect(bid).toEqual(mockResp.data);
    expect(fetch).toHaveBeenCalledWith(
      `${API}/auction/listings/1/bids`,
      expect.objectContaining({
        method: "POST",
        headers: mockHeaders,
        body: JSON.stringify({ amount: 100 }),
      }),
    );
  });
});
