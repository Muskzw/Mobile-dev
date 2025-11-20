import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// For physical devices, replace localhost with your computer's IP address
// You can find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
// Look for IPv4 Address on your WiFi adapter
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.146:5000/api'  // Use your computer's IP address
  : 'https://your-api-domain.com/api';

// For Android Emulator, you can use:
// const API_BASE_URL = __DEV__ 
//   ? 'http://10.0.2.2:5000/api'  // Android Emulator uses 10.0.2.2 to access host machine
//   : 'https://your-api-domain.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log all requests for debugging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
}, (error) => {
  console.error('Request setup error:', error);
  return Promise.reject(error);
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

