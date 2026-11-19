
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getTreatments,
  updateTreatment,
  deleteTreatment,
} from "../services/treatmentService";

import type {
  UpdateTreatmentPayload,
} from "../types/treatment";

export const TREATMENTS_QUERY_KEY = ["treatments"] as const;

export function useTreatments(clinicId: number) {
  const queryClient = useQueryClient();

  const queryKey = [...TREATMENTS_QUERY_KEY, clinicId];

  // GET treatments
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getTreatments(clinicId),
    enabled: clinicId > 0,
    staleTime: 5 * 60 * 1000,
  });

  // UPDATE treatment
  const updateMutation = useMutation({
    mutationFn: ({
      treatmentId,
      payload,
    }: {
      treatmentId: number;
      payload: UpdateTreatmentPayload;
    }) => updateTreatment(clinicId, treatmentId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey,
      });
    },
  });

  // DELETE treatment
  const deleteMutation = useMutation({
    mutationFn: (treatmentId: number) =>
      deleteTreatment(clinicId, treatmentId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey,
      });
    },
  });

  return {
    treatments: data?.treatments ?? [],

    loading: isLoading,
    fetching: isFetching,
    error,

    reloadTreatments: refetch,

    updateTreatment: updateMutation.mutateAsync,
    deleteTreatment: deleteMutation.mutateAsync,

    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
