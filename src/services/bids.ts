import { authHeaders } from "./apiKey";
import type { Bid } from "../types";
import { API } from "../api/constants";

export async function createBid(
  listingId: string,
  amount: number,
): Promise<Bid> {
  const headers = await authHeaders(); // headers object

  const res = await fetch(`${API}/auction/listings/${listingId}/bids`, {
    method: "POST",
    headers, // use headers object directly
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create bid: ${errorText}`);
  }

  const data = await res.json();
  return data.data as Bid;
}
