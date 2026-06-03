import client from './client';

export const getProfile = () => client.get('/student/profile');
export const updateProfile = (data: any) => client.put('/student/profile', data);
export const getEligibleJobs = () => client.get('/student/jobs');
export const applyToJob = (id: number) => client.post(`/student/jobs/${id}/apply`);
export const getApplications = () => client.get('/student/applications');
export const getInterviews = () => client.get('/student/interviews');
