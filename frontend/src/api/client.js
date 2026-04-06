import axios from 'axios';
import { getIsNative } from '../hooks/useNative';

const RAILWAY_API = 'https://web-production-29410.up.railway.app/api';

const baseURL = import.meta.env.VITE_API_URL
  || (getIsNative() ? RAILWAY_API : '/api');

const client = axios.create({
  baseURL,
  timeout: 15000,
});

// Request interceptor — attach auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// Helper to extract data from response
export const apiRequest = async (promise) => {
  try {
    const response = await promise;
    return { data: response.data.data, error: null };
  } catch (err) {
    const error = err.response?.data?.error || err.message || 'Something went wrong';
    return { data: null, error };
  }
};
