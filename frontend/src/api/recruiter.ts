import client from './client';

export const getJobs = () => client.get('/recruiter/jobs');
export const createJob = (data: any) => client.post('/recruiter/jobs', data);
export const getApplicants = (jobId: number) => client.get(`/recruiter/jobs/${jobId}/applicants`);
export const updateStatus = (appId: number, status: string) => client.patch(`/recruiter/applications/${appId}/status`, { status });
export const scheduleInterview = (data: any) => client.post('/recruiter/interviews', data);
