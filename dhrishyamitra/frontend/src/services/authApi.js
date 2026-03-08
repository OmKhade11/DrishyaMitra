import { apiFetch } from "./apiClient";
import { clearAuthSession, getStoredUser, setAuthSession } from "./authStorage";

export async function registerUser(payload) {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  setAuthSession(data.access_token, data.user);
  return data.user;
}

export async function loginUser(payload) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  setAuthSession(data.access_token, data.user);
  return data.user;
}

export async function fetchCurrentUser() {
  const data = await apiFetch("/api/auth/me");
  return data.user;
}

export function logoutUser() {
  clearAuthSession();
}

export function getInitialUser() {
  return getStoredUser();
}
