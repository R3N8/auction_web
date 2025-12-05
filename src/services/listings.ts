import { API } from "../api/constants";
import { authHeaders } from "../services/apiKey";
import { load } from "../utils/storage";
import type { Listing, FetchListingsParams } from "../types";

// Fetch listings with optional filters: page, tag, active status, and search query
export async function fetchListings(
  params?: FetchListingsParams,
): Promise<Listing[]> {
  const queryParams = new URLSearchParams();
  if (params?._seller) queryParams.append("_seller", "true");
  if (params?._bids) queryParams.append("_bids", "true");
  if (params?.q) queryParams.append("q", params.q);
  if (params?.page) queryParams.append("page", params.page.toString());

  const res = await fetch(`${API}/auction/listings?${queryParams.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  const data = await res.json();
  return data.data;
}

// Fetch a single listing by ID, with optional inclusion of seller and bids
export async function getListingById(
  id: string,
  includeSeller = false,
  includeBids = false,
) {
  const params = new URLSearchParams();
  if (includeSeller) params.set("_seller", "true");
  if (includeBids) params.set("_bids", "true");

  const res = await fetch(`${API}/auction/listings/${id}?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch listing ${id}`);
  const data = await res.json();

  return data.data;
}

// Create a new listing
export async function createListing(payload: {
  title: string;
  description: string;
  tags?: string[];
  media?: { url: string; alt: string }[];
  endsAt: string;
}) {
  const user = load("user");
  if (!user?.accessToken) throw new Error("User not logged in");

  const headers = {
    Authorization: `Bearer ${user.accessToken}`,
    "Content-Type": "application/json",
  };

  console.log("Creating listing with headers:", headers);
  console.log("Payload:", payload);

  const res = await fetch(`${API}/auction/listings`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create listing");
  }

  const data = await res.json();
  console.log("Listing created:", data.data);
  return data.data;
}

// Update an existing listing
export async function updateListing(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    tags: string[];
    media: { url: string; alt: string }[];
    endsAt: string;
  }>,
) {
  const headers = await authHeaders();
  const res = await fetch(`${API}/auction/listings/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update listing");
  const data = await res.json();
  return data.data;
}

// Delete a listing by ID
export async function deleteListing(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API}/auction/listings/${id}`, {
    method: "DELETE",
    headers,
  });

  if (res.status !== 204) throw new Error("Failed to delete listing");
  return true;
}

// Place bid on a listing
export async function placeBid(listingId: string, amount: number) {
  const headers = await authHeaders();

  const res = await fetch(`${API}/auction/listings/${listingId}/bids`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to place bid");
  }
  return data.data;
}
