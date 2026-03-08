import API_URL from "../config/api";
import { getAuthToken } from "./authStorage";

export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;

    if (response.status === 401) {
      localStorage.removeItem("drishya_token");
      localStorage.removeItem("drishya_user");
    }

    throw new Error(message);
  }

  return data;
}
