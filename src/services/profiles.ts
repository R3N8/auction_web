import { API } from "../api/constants";
import { authHeaders } from "./apiKey";
import type { Profile, ProfileUpdate } from "../types";
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
