import axios from 'axios';

// Set VITE_API_URL at build time (e.g. in Vercel) to point at the deployed backend.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 20_000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('placement_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('placement_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
