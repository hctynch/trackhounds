import axios from 'axios';

// No need for a base URL in development as the proxy handles it
// In production, use your EC2 IP
const baseURL = import.meta.env.DEV 
  ? '' // Empty string means use relative URLs that will be picked up by the Vite proxy
  : 'https://trackhounds.live';

const axiosInstance = axios.create({
  baseURL
});

// Intercept the request to add authenticated user token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;