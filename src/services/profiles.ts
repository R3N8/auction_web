import { API } from "../api/constants";
import { authHeaders } from "./apiKey";
import type { Listing, Bid, Profile, ProfileUpdate } from "../types";
import { getCurrentUser } from "./auth";

export async function getProfile(name: string): Promise<Profile> {
  const headers = await authHeaders(); // ensure access token + apiKey
  const res = await fetch(
    `${API}/auction/profiles/${name}?_listings=true&_wins=true`,
    {
      headers,
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch profile ${name}: ${res.status} ${res.statusText}`,
    );
  }

  const data = await res.json();
  return data.data;
}

// Update profile
export async function updateProfile(payload: ProfileUpdate) {
  const currentUser = getCurrentUser();
  if (!currentUser?.name) throw new Error("User not logged in");

  const headers = await authHeaders(); // includes token + X-Noroff-API-Key

  const res = await fetch(`${API}/auction/profiles/${currentUser.name}`, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Update error:", errorText);
    throw new Error("Failed to update profile");
  }

  return res.json() as Promise<{ data: Profile }>;
}

export async function getProfileListings(name: string): Promise<Listing[]> {
  const headers = await authHeaders();
  const res = await fetch(
    `${API}/auction/profiles/${name}/listings?_bids=true`,
    { headers },
  );
  if (!res.ok) throw new Error(`Failed to fetch listings for ${name}`);
  const data = await res.json();
  return data.data as Listing[];
}

export async function getProfileBids(
  name: string,
): Promise<(Bid & { listing?: Listing })[]> {
  const headers = await authHeaders();
  const res = await fetch(
    `${API}/auction/profiles/${name}/bids?_listings=true`,
    { headers },
  );
  if (!res.ok) throw new Error(`Failed to fetch bids for ${name}`);
  const data = await res.json();
  return data.data as (Bid & { listing?: Listing })[];
}

export async function getProfileWins(name: string): Promise<Listing[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API}/auction/profiles/${name}/wins`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch wins for ${name}`);
  const data = await res.json();
  return data.data as Listing[];
}
