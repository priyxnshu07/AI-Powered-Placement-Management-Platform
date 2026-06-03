import client from './client';

export const getDashboard = () => client.get('/officer/dashboard');
export const getStudents = () => client.get('/officer/students');
export const getJobs = () => client.get('/officer/jobs');
export const getApplications = () => client.get('/officer/applications');
