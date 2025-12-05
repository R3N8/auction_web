import type { Listing } from "../types";

export function getHighestBid(listing: Listing): number {
  if (!listing.bids || listing.bids.length === 0) return 0;
  return Math.max(...listing.bids.map((b) => Number(b.amount)));
}
