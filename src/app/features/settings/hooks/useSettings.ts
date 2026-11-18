
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSettings,
  updateProfile,
  updatePassword,
} from "../services/settingsService";

import type {
  UpdateProfilePayload,
  UpdatePasswordPayload,
} from "../types/settings";

export const SETTINGS_QUERY_KEY = ["settings"] as const;

export function useSettings() {
  const queryClient = useQueryClient();

  // Consultar configuración del usuario.
  const settingsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: getSettings,
  });

  // Actualizar información del perfil.
  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      updateProfile(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SETTINGS_QUERY_KEY,
      });
    },
  });

  // Cambiar contraseña.
  const updatePasswordMutation = useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      updatePassword(payload),
  });

  return {
    user: settingsQuery.data?.user,

    loading: settingsQuery.isLoading,
    error: settingsQuery.error,
    refetchSettings: settingsQuery.refetch,

    updateProfile: updateProfileMutation.mutateAsync,
    updatingProfile: updateProfileMutation.isPending,

    updatePassword: updatePasswordMutation.mutateAsync,
    updatingPassword: updatePasswordMutation.isPending,
  };
}
