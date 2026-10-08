import client from './client';
import type { Applicant, ApiResponse, Application, CreateJobPayload, Interview, Job, ScheduleInterviewPayload } from '../types/api';

export const getJobs = () => client.get<ApiResponse<Job[]>>('/recruiter/jobs');
export const createJob = (data: CreateJobPayload) => client.post<ApiResponse<Job>>('/recruiter/jobs', data);
export const getApplicants = (jobId: number) => client.get<ApiResponse<Applicant[]>>(`/recruiter/jobs/${jobId}/applicants`);
export const updateStatus = (appId: number, status: string) =>
  client.patch<ApiResponse<Application>>(`/recruiter/applications/${appId}/status`, { status });
export const scheduleInterview = (data: ScheduleInterviewPayload) =>
  client.post<ApiResponse<Interview>>('/recruiter/interviews', data);
