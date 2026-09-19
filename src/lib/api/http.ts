import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string, searchParams?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(path, API_BASE_URL || "http://placeholder.local");
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  const res = await fetch(API_BASE_URL ? url.toString() : path, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, res.status);
  }
  return res.json() as Promise<T>;
}

export function toQueryString<T extends object>(params: T): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(","));
    } else {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
