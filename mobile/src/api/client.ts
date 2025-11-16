import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-api-domain.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const currentCompany = useAuthStore.getState().currentCompany;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (currentCompany) {
    config.headers['x-company-id'] = currentCompany.id;
  }
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;

