import api from './client.js';
import type { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, User } from '@lorcana/shared';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const res = await api.post('/auth/google', { credential });
  return res.data;
}

export async function discordLogin(code: string): Promise<AuthResponse> {
  const res = await api.post('/auth/discord', { code });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get('/auth/me');
  return res.data.user;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const res = await api.put('/auth/profile', data);
  return res.data.user;
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.put('/auth/password', data);
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  const res = await api.post('/auth/forgot-password', data);
  return res.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  const res = await api.post('/auth/reset-password', data);
  return res.data;
}
