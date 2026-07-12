import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/** Normalise backend/axios errors into a readable message. */
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string }; detail?: unknown }
      | undefined;
    if (data?.error?.message) return data.error.message;
    if (typeof data?.detail === "string") return data.detail;
    if (error.code === "ERR_NETWORK")
      return "Cannot reach the shoko API. Is the backend running on " +
        `${API_BASE_URL}?`;
    return error.message;
  }
  return "An unexpected error occurred.";
}
