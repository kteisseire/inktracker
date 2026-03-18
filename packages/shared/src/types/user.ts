export interface User {
  id: string;
  email: string;
  username: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasDiscord: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface AdminUserInfo {
  id: string;
  email: string;
  username: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasDiscord: boolean;
  createdAt: string;
  tournamentsCount: number;
  decksCount: number;
  teamsCount: number;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
