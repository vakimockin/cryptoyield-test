const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const STORAGE_KEY = "cryptoyield_user_id";
const DEFAULT_USER = "11111111-1111-1111-1111-111111111111";

function currentUserId(): string {
  if (typeof window === "undefined") return DEFAULT_USER;
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_USER;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-User-Id", currentUserId());

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
