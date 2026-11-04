export interface AuthUser {
  id: number;
  name: string;
  email?: string | null;
  phone?: string;
  role: "user" | "admin";
  is_verified?: boolean;
  /** False only for an account made at guest checkout that hasn't set one yet. */
  has_password?: boolean;
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
