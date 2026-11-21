
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} from "../services/treatmentService";

import type {
  CreateTreatmentPayload,
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

  // CREATE treatment
  const createMutation = useMutation({
    mutationFn: (payload: CreateTreatmentPayload) =>
      createTreatment(clinicId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey,
      });
    },
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

    createTreatment: createMutation.mutateAsync,
    updateTreatment: updateMutation.mutateAsync,
    deleteTreatment: deleteMutation.mutateAsync,

    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
