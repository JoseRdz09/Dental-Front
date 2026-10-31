
export interface UserSettings {
  id: number;
  name: string;
  email: string;
}

export interface SettingsResponse {
  user: UserSettings;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: UserSettings;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface SettingsMessageResponse {
  message: string;
}
