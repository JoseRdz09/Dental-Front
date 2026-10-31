import { createContext } from "react";
import type {
  LoginCredentials,
  LoginResponse,
  User,
} from "../../../types/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<LoginResponse>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
