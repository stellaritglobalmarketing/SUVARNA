import type { AuthUser } from "@/types/auth";

/** Fired on `window` when the backend rejects the stored token (expired, logged out elsewhere, account deactivated). */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

// Key names predate the Suvarna7 rebrand; kept so existing sessions survive.
const TOKEN_KEY = "harvesta_auth_token";
const USER_KEY = "harvesta_auth_user";

/**
 * localStorage-backed session storage, read directly by the plain `fetch`
 * helpers in lib/api/http.ts (which live outside the React tree) and mirrored
 * into Redux's authSlice for components to react to. Guarded for SSR since
 * these run during the server render pass of client components too.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
