import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as authService from "./services/authServices";
import type {
  LoginCredentials,
  LoginResponse,
  User,
} from "../../../types/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Recuperar la sesión existente.
  useEffect(() => {
    let active = true;

    authService
      .getCurrentUser()
      .then(({ user, organizations, clinics }) => {
        if (active) {
          setUser({
            ...user,
            organizations,
            clinics,
          });
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

  // Iniciar sesión y conservar los roles de organización y clínica.
  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await authService.login(credentials);

      setUser({
        ...response.user,
        organizations: response.organizations,
        clinics: response.clinics,
      });

      return response;
    },
    []
  );

  // Cerrar sesión.
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}