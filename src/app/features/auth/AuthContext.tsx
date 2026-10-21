
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as authService from "./services/authServices";
import type { LoginCredentials, User } from "../../../types/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService
      .getCurrentUser()
      .then(({ user }) => {
        if (active) {
          setUser(user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);

      setUser(response.user);

      return response.user;
    },
    []
  );

  

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
