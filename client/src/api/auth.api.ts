import api from './client.js';
import type { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest, User } from '@lorcana/shared';

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
