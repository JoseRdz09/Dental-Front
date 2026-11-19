
export interface Treatment {
  id: number;
  clinic_id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TreatmentsResponse {
  treatments: Treatment[];
}

export interface UpdateTreatmentPayload {
  name?: string;
  description?: string | null;
  duration?: number;
  price?: number;
  is_active?: boolean;
}

export interface TreatmentResponse {
  message: string;
  treatment?: Treatment;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
