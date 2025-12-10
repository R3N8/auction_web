import { describe, it, expect } from "vitest";
import { getHighestBid } from "./getHighestBid";

describe("getHighestBid", () => {
  const baseListing = {
    id: "1",
    title: "Sample",
    description: "This is a sample listing.",
    createdAt: "",
    endsAt: "",
    _count: { bids: 0 },
  };

  const makeBid = (amount: number) => ({
    id: "bid-" + Math.random().toString(36).slice(2, 9),
    amount,
    created: "",
    bidder: { name: "Test", email: "test@example.com" },
  });

  it("should return 0 when no bids", () => {
    expect(getHighestBid({ ...baseListing, bids: [] })).toBe(0);
    expect(getHighestBid({ ...baseListing, bids: undefined })).toBe(0);
  });

  it("should return the highest bid amount", () => {
    const listing = {
      ...baseListing,
      bids: [makeBid(100), makeBid(200), makeBid(150)],
    };
    expect(getHighestBid(listing)).toBe(200);
  });

  it("should handle negative and zero bid amounts", () => {
    const listing = {
      ...baseListing,
      bids: [makeBid(-50), makeBid(0), makeBid(25)],
    };
    expect(getHighestBid(listing)).toBe(25);
  });
});
