export interface AuthUser {
  id: number;
  name: string;
  email?: string | null;
  phone?: string;
  role: "user" | "admin";
  is_verified?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface SignupPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}
