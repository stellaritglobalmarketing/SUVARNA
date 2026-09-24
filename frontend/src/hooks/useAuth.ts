import { login as loginRequest, logout as logoutRequest, signup as signupRequest } from "@/lib/api/auth";
import { USE_MOCK_API } from "@/lib/api/config";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearCredentials, selectAuthToken, selectAuthUser, selectIsAuthenticated, setCredentials } from "@/lib/redux/slices/authSlice";
import { clearSession, getToken, saveSession } from "@/lib/auth/token";
import type { LoginPayload, SignupPayload } from "@/types/auth";

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
    return session;
  };

  const signup = async (payload: SignupPayload) => {
    const session = await signupRequest(payload);
    saveSession(session.token, session.user);
    dispatch(setCredentials(session));
    return session;
  };

  const logout = () => {
    // Fire-and-forget: the request reads the token synchronously as it starts, so clearing the
    // session right after is safe. The user is logged out locally even if the server call fails.
    if (!USE_MOCK_API && getToken()) {
      logoutRequest().catch(() => undefined);
    }
    clearSession();
    dispatch(clearCredentials());
  };

  return { user, token, isAuthenticated, login, signup, logout };
}
