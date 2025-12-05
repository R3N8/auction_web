import { API } from "../api/constants";
import { load, save } from "../utils/storage";

export async function getApiKey(accessToken: string) {
  const savedKey = load("apiKey");
  if (savedKey) {
    return savedKey;
  }

  const res = await fetch(`${API}/auth/create-api-key`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  save("apiKey", data.data.key);
  return data.data.key;
}

export async function authHeaders() {
  const user = load("user");
  const apiKey = load("apiKey");
  if (!user?.accessToken || !apiKey) {
    throw new Error("User not logged in or missing API key");
  }

  return {
    Authorization: `Bearer ${user.accessToken}`,
    "X-Noroff-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}
