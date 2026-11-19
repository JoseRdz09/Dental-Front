
import axios from "axios";
import { api } from "../../../../lib/axios";

import type {
  TreatmentsResponse,
  TreatmentResponse,
  UpdateTreatmentPayload,
  ApiErrorResponse,
} from "../types/treatment";

export async function getTreatments(
  clinicId: number
): Promise<TreatmentsResponse> {
  try {
    const { data } = await api.get<TreatmentsResponse>(
      `/api/clinics/${clinicId}/treatments`
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(
        error.response?.data?.message ||
        "Error loading treatments."
      );
    }

    throw error;
  }
}

export async function updateTreatment(
  clinicId: number,
  treatmentId: number,
  payload: UpdateTreatmentPayload
): Promise<TreatmentResponse> {
  try {
    const { data } = await api.put<TreatmentResponse>(
      `/api/clinics/${clinicId}/treatments/${treatmentId}`,
      payload
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(
        error.response?.data?.message ||
        "Error updating treatment."
      );
    }

    throw error;
  }
}

export async function deleteTreatment(
  clinicId: number,
  treatmentId: number
): Promise<TreatmentResponse> {
  try {
    const { data } = await api.delete<TreatmentResponse>(
      `/api/clinics/${clinicId}/treatments/${treatmentId}`
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(
        error.response?.data?.message ||
        "Error deleting treatment."
      );
    }

    throw error;
  }
}
