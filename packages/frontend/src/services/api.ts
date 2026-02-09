import axios, { AxiosInstance, AxiosError } from 'axios';

// API base URL - defaults to proxy in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    // Handle errors globally
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      console.error('API Error:', {
        status,
        message: data?.message || error.message,
        code: data?.code,
      });

      // Handle specific error codes
      if (status === 401) {
        // Unauthorized - redirect to login if needed
        console.error('Unauthorized access');
      } else if (status === 429) {
        // Rate limit exceeded
        console.error('Rate limit exceeded');
      } else if (status >= 500) {
        // Server error
        console.error('Server error');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received', error.request);
    } else {
      // Error setting up request
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
