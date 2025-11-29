import { API } from "../api/constants";
import { authHeaders } from "../services/apiKey";

// Fetch listings with optional filters: page, tag, active status, and search query
export async function fetchListings(
  opts: {
    page?: number;
    tag?: string;
    active?: boolean;
    q?: string;
  } = {},
) {
  try {
    let url = "";

    // Search query
    if (opts.q) {
      const params = new URLSearchParams();
      params.set("q", opts.q);
      params.set("_seller", "true");
      params.set("_bids", "true");

      url = `${API}/auction/listings/search?q=${encodeURIComponent(opts.q)}`;
    } else {
      const params = new URLSearchParams();
      if (opts.page) params.set("page", String(opts.page));
      if (opts.tag) params.set("_tag", opts.tag); // correct per docs
      if (opts.active !== undefined) params.set("_active", String(opts.active));

      params.set("_seller", "true");
      params.set("_bids", "true");

      url = `${API}/auction/listings?${params.toString()}`;
    }

    const res = await fetch(url);
    if (!res.ok) return []; // 404 or other errors

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
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
  const headers = await authHeaders();
  const res = await fetch(`${API}/auction/listings`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 400) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Validation error");
  }

  const data = await res.json();
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
