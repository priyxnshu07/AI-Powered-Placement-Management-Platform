import client from './client';

export const getUsers = () => client.get('/admin/users');
export const createUser = (data: any) => client.post('/admin/users', data);
export const deleteUser = (id: number) => client.delete(`/admin/users/${id}`);
export const getAIConfig = () => client.get('/admin/ai/config');
export const updateAIConfig = (data: any) => client.put('/admin/ai/config', data);
