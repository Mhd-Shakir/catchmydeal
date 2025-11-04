import axios from 'axios';

// --- FIXED LINE ---
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// ------------------

const api = axios.create({
  // Use the environment variable, or fall back to localhost for local testing
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    let token = null;

    // 1. Try to get token from 'userInfo' object
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.token) {
          token = userInfo.token;
        }
      } catch (e) {
        console.error('Failed to parse userInfo from localStorage', e);
      }
    }

    // 2. If not found, try to get token directly from 'token'
    if (!token) {
      token = localStorage.getItem('token');
    }

    // 3. If a token was found, add it to the header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Only redirect if we are not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;