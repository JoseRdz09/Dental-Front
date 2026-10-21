
import { api } from "../../../../lib/axios";
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
} from "../../../../types/auth";

// Comparte una única petición mientras esté en curso.
let currentUserRequest: Promise<MeResponse> | null = null;

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  // Obtener la cookie CSRF de Laravel Sanctum.
  await api.get("/sanctum/csrf-cookie");

  const { data } = await api.post<LoginResponse>(
    "/api/login",
    credentials
  );

  // Evita reutilizar una petición de usuario anterior al iniciar sesión.
  currentUserRequest = null;

  return data;
}

export function getCurrentUser(): Promise<MeResponse> {
  if (!currentUserRequest) {
    currentUserRequest = api
      .get<MeResponse>("/api/user")
      .then(({ data }) => data)
      .finally(() => {
        currentUserRequest = null;
      });
  }

  return currentUserRequest;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/logout");
  } finally {
    // Evita reutilizar la petición de usuario tras cerrar sesión.
    currentUserRequest = null;
  }
}
