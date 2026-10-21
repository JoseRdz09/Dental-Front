
export type ClinicTeamRole =
  | "clinic_admin"
  | "dentist"
  | "receptionist";

export interface ClinicTeamMember {
  clinic_id: number;
  user_id: number;
  name: string;
  email: string;
  role: ClinicTeamRole;
  created_at: string;
  updated_at: string;
}

export interface ClinicTeamResponse {
  clinic_id: number;
  total: number;
  data: ClinicTeamMember[];
}
