import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

// Devices
export const getDevices = () => api.get('/devices');

export const getDevice = (id) => api.get(`/devices/${id}`);

// Screenshots
export const getScreenshots = (params = {}) =>
  api.get('/screenshots', { params });

export const getScreenshot = (id) => api.get(`/screenshots/${id}`);

export const deleteScreenshot = (id) => api.delete(`/screenshots/${id}`);

// Screenshot Requests
export const requestScreenshot = (deviceId) =>
  api.post('/requests', { deviceId });

export default api;
