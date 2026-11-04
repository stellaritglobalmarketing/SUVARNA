import { useCallback } from "react";
import { login as loginRequest, logout as logoutRequest, signup as signupRequest } from "@/lib/api/auth";
import { USE_MOCK_API } from "@/lib/api/config";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearCredentials, selectAuthToken, selectAuthUser, selectIsAuthenticated, setCredentials } from "@/lib/redux/slices/authSlice";
import { clearSession, getToken, saveSession } from "@/lib/auth/token";
import { clearGuestTokens } from "@/lib/auth/guestOrders";
import { track } from "@/lib/tracking/track";
import type { AuthSession, LoginPayload, SignupPayload } from "@/types/auth";

/** Takes on a session that didn't come from the login form, such as the one a paid guest order hands over. */
export function useAdoptSession() {
  const dispatch = useAppDispatch();
  return useCallback(
    (session: AuthSession) => {
      saveSession(session.token, session.user);
      dispatch(setCredentials(session));
    },
    [dispatch],
  );
}

/** Wraps the auth API calls with Redux + localStorage persistence so every call site stays in sync. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const token = useAppSelector(selectAuthToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = async (payload: LoginPayload) => {
    const session = await loginRequest(payload);
    saveSession(session.token, session.user);
    dispatch(setCredentials(session));
    track("login");
    return session;
  };

  const signup = async (payload: SignupPayload) => {
    const session = await signupRequest(payload);
    saveSession(session.token, session.user);
    dispatch(setCredentials(session));
    track("signup");
    return session;
  };

  const logout = () => {
    // Fire-and-forget: the request reads the token synchronously as it starts, so clearing the
    // session right after is safe. The user is logged out locally even if the server call fails.
    if (!USE_MOCK_API && getToken()) {
      logoutRequest().catch(() => undefined);
    }
    clearSession();
    clearGuestTokens();
    dispatch(clearCredentials());
  };

  return { user, token, isAuthenticated, login, signup, logout };
}
