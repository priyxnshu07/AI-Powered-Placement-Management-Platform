import client from './client';

export const login = (data: any) => client.post('/auth/login', data);
export const getMe = () => client.get('/auth/me');
