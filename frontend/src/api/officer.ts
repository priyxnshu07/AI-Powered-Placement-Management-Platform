import client from './client';
import type { ApiResponse, Application, Job, OfficerDashboard, OfficerStudent } from '../types/api';

export const getDashboard = () => client.get<ApiResponse<OfficerDashboard>>('/officer/dashboard');
export const getStudents = () => client.get<ApiResponse<OfficerStudent[]>>('/officer/students');
export const getJobs = () => client.get<ApiResponse<Job[]>>('/officer/jobs');
export const getApplications = () => client.get<ApiResponse<Application[]>>('/officer/applications');
