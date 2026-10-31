
import { api } from "../../../../lib/axios";

import type {
  SettingsResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
  UpdatePasswordPayload,
  SettingsMessageResponse,
} from "../types/settings";

/**
 * Obtener la información del usuario autenticado.
 */
export async function getSettings(): Promise<SettingsResponse> {
  const { data } = await api.get<SettingsResponse>("/api/settings");

  return data;
}

/**
 * Actualizar nombre y correo electrónico.
 */
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> {
  const { data } = await api.put<UpdateProfileResponse>(
    "/api/settings/profile",
    payload,
  );

  return data;
}

/**
 * Cambiar la contraseña del usuario autenticado.
 */
export async function updatePassword(
  payload: UpdatePasswordPayload,
): Promise<SettingsMessageResponse> {
  const { data } = await api.put<SettingsMessageResponse>(
    "/api/settings/password",
    payload,
  );

  return data;
}
