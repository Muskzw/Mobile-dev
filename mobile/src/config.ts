// Configuration file for the application

// API URL configuration
// For physical devices, use your computer's local IP address (e.g., http://192.168.1.x:5000)
// For Android Emulator, use http://10.0.2.2:5000
// For iOS Simulator, use http://localhost:5000
export const API_URL = __DEV__
    ? 'http://192.168.1.239:5000/api' // Local machine IP
    : 'https://your-api-domain.com/api';

export const BASE_URL = API_URL.replace('/api', '');
