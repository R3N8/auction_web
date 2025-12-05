import type { LoginData, RegisterData } from "../types";
import { API } from "../api/constants";
import { getApiKey } from "./apiKey";
import { save, load } from "../utils/storage";

// Login function - sends user credentials to the backend and saves the user data on success
export async function login(data: LoginData) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message || "Login failed");
  }

  save("user", json.data);

  const apiKey = await getApiKey(json.data.accessToken);
  save("apiKey", apiKey);
  return json.data;
}

// Register new user function
export async function register(data: RegisterData) {
  const { name, email, password } = data;
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message || "Registration failed");
  }

  return json.data;
}

// Logout function - clears user data from local storage
export function logout() {
  localStorage.removeItem("user");
  window.location.hash = "/";
}

// Get current logged-in user
export function getCurrentUser() {
  return load("user");
}
