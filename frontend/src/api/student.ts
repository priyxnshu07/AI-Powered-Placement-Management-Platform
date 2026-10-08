import client from './client';
import type { ApiResponse, Application, Interview, Job, ProfilePayload, StudentProfile } from '../types/api';

export const getProfile = () => client.get<ApiResponse<StudentProfile | null>>('/student/profile');
export const updateProfile = (data: ProfilePayload) => client.put<ApiResponse<StudentProfile>>('/student/profile', data);
export const getEligibleJobs = () => client.get<ApiResponse<Job[]>>('/student/jobs');
export const applyToJob = (id: number) => client.post<ApiResponse<Application>>(`/student/jobs/${id}/apply`);
export const getApplications = () => client.get<ApiResponse<Application[]>>('/student/applications');
export const getInterviews = () => client.get<ApiResponse<Interview[]>>('/student/interviews');
