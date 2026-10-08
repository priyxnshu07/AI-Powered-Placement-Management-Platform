import client from './client';
import type { ApiResponse, LoginPayload, StudentProfile, User } from '../types/api';

export const login = (data: LoginPayload) => client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data);
export const getMe = () => client.get<ApiResponse<{ user: User; profile: StudentProfile | null }>>('/auth/me');
