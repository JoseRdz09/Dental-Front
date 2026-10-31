import { api } from "../../../../lib/axios";
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
} from "../../../../types/auth";

// Comparte una única petición de usuario mientras está en curso.
let currentUserRequest: Promise<MeResponse> | null = null;

export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  // Obtener la cookie CSRF de Laravel Sanctum.
  await api.get("/sanctum/csrf-cookie");

  // Iniciar sesión.
  const { data } = await api.post<LoginResponse>(
    "/api/login",
    credentials
  );

  // Invalidar la referencia a una petición anterior.
  currentUserRequest = null;

  return data;
}

export function getCurrentUser(): Promise<MeResponse> {
  if (!currentUserRequest) {
    const request = api
      .get<MeResponse>("/api/user")
      .then(({ data }) => data);

    currentUserRequest = request;

    request.finally(() => {
      if (currentUserRequest === request) {
        currentUserRequest = null;
      }
    }).catch(() => {
      // Evita una promesa rechazada sin gestionar.
    });
  }

  return currentUserRequest;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/logout");
  } finally {
    currentUserRequest = null;
  }
}