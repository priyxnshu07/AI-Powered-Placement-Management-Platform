import client from './client';
import type { AdminUser, AIConfig, ApiResponse, CreateUserPayload } from '../types/api';

export const getUsers = () => client.get<ApiResponse<AdminUser[]>>('/admin/users');
export const createUser = (data: CreateUserPayload) => client.post<ApiResponse<AdminUser>>('/admin/users', data);
export const deleteUser = (id: number) => client.delete<ApiResponse<AdminUser>>(`/admin/users/${id}`);
export const getAIConfig = () => client.get<ApiResponse<AIConfig>>('/admin/ai/config');
export const updateAIConfig = (data: { threshold: number }) =>
  client.put<ApiResponse<{ threshold: number }>>('/admin/ai/config', data);
