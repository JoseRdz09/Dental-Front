export type UserRole = "owner" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
   role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
