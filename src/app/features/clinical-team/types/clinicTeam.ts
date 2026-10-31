
export type ClinicTeamRole =
  | "clinic_admin"
  | "dentist"
  | "assistant"
  | "cashier";

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

export interface CreateClinicTeamMemberPayload {
  name: string;
  email: string;
  role: ClinicTeamRole;
}

export interface UpdateClinicTeamMemberPayload {
  name: string;
  email: string;
  role: ClinicTeamRole;
  generate_temporary_password: boolean;
}

export interface CreateClinicTeamMemberResponse {
  message?: string;
  temporary_password?: string;
}


export interface ClinicTeamEditModalProps {
  clinicId: number;
  member: ClinicTeamMember;
  onClose: () => void;
  onSaved: () => void;
}

export interface ClinicTeamTableProps {
  members: ClinicTeamMember[];
  total: number;
  loading: boolean;
  error: string | null;
  clinicId: number | null;
  onReload: () => void;
  onEdit: (member: ClinicTeamMember) => void;
  onDelete: (member: ClinicTeamMember) => void;
}

export interface DeleteClinicTeamMemberModalProps {
  memberName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CLINIC_TEAM_ROLES = [
  "clinic_admin",
  "dentist",
  "assistant",
  "cashier",
] as const satisfies readonly ClinicTeamRole[];

export interface ClinicTeamCreateModalProps {
  clinicId: number;
  onClose: () => void;
  onCreated: () => void;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
