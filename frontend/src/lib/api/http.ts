import { SESSION_EXPIRED_EVENT, clearSession, getToken } from "@/lib/auth/token";
import { API_BASE_URL, API_KEY } from "./config";

export const SESSION_EXPIRED_MESSAGE = "Your session has ended. Please log in again.";

/** True when a request failed because the customer's session is no longer valid (they've been logged out). */
export function isSessionExpiredError(error: unknown): boolean {
  // Checked by shape rather than `instanceof`, which breaks if this module is ever loaded twice.
  const candidate = error as Partial<ApiError> | null;
  return typeof candidate === "object" && candidate !== null && candidate.status === 401 && candidate.code === -1;
}

export class ApiError extends Error {
  status: number;
  /** The backend's own `code` field (see backend/README.md's "code values" table), not the HTTP status. */
  code: number;

  constructor(message: string, status: number, code: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface ApiEnvelope<T> {
  code: number;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

function buildUrl(path: string, searchParams?: Record<string, string | undefined>): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + cleanPath);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value != null && value !== "") url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

async function rawRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: { searchParams?: Record<string, string | undefined>; body?: unknown } = {},
): Promise<ApiEnvelope<T>> {
  const hasBody = options.body !== undefined;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["api-key"] = API_KEY;
  if (hasBody) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.searchParams), {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0, 0);
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!res.ok) {
    // The backend answers a bad/expired/revoked token with 401 + code -1. (A wrong api-key does
    // too, but with message "Unauthorized" — that's a config problem, not the user's session.)
    if (token && res.status === 401 && envelope?.code === -1 && envelope.message !== "Unauthorized") {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError(SESSION_EXPIRED_MESSAGE, res.status, -1);
    }
    throw new ApiError(envelope?.message || `Request failed: ${res.status} ${res.statusText}`, res.status, envelope?.code ?? -1);
  }
  if (!envelope || envelope.code !== 1) {
    throw new ApiError(envelope?.message || "Something went wrong.", res.status, envelope?.code ?? 0);
  }
  return envelope;
}

export async function apiGet<T>(path: string, searchParams?: Record<string, string | undefined>): Promise<T> {
  const envelope = await rawRequest<T>("GET", path, { searchParams });
  return envelope.data as T;
}

export async function apiGetPaginated<T>(
  path: string,
  searchParams?: Record<string, string | undefined>,
): Promise<{ data: T; pagination?: PaginationMeta }> {
  const envelope = await rawRequest<T>("GET", path, { searchParams });
  return { data: envelope.data as T, pagination: envelope.pagination };
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const envelope = await rawRequest<T>("POST", path, { body: body ?? {} });
  return envelope.data as T;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const envelope = await rawRequest<T>("PUT", path, { body: body ?? {} });
  return envelope.data as T;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const envelope = await rawRequest<T>("PATCH", path, { body: body ?? {} });
  return envelope.data as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const envelope = await rawRequest<T>("DELETE", path, {});
  return envelope.data as T;
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
