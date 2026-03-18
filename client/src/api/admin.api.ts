import api from './client.js';
import type { AdminUserInfo } from '@lorcana/shared';

export async function listUsers(): Promise<AdminUserInfo[]> {
  const res = await api.get('/admin/users');
  return res.data.users;
}
