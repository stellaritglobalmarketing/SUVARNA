import type { AuthSession, LoginPayload, SignupPayload } from "@/types/auth";
import { apiPost } from "./http";

export async function signup(payload: SignupPayload): Promise<AuthSession> {
  return apiPost<AuthSession>("/user/signup", payload);
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  return apiPost<AuthSession>("/user/login", payload);
}
