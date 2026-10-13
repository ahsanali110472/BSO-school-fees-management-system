import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'http://localhost:5000/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize API error handling and envelope compatibility
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    // Provide bidirectional compatibility for both response.data.data and response.data patterns
    if (body && typeof body === 'object') {
      if (body.data === undefined) {
        Object.defineProperty(body, 'data', {
          get() {
            return this;
          },
          configurable: true,
          enumerable: false,
        });
      } else if (body.data && typeof body.data === 'object') {
        if (body.data.data === undefined) {
          Object.defineProperty(body.data, 'data', {
            get() {
              return this;
            },
            configurable: true,
            enumerable: false,
          });
        }
        if (body.data.success === undefined) {
          Object.defineProperty(body.data, 'success', {
            get() {
              return body.success;
            },
            configurable: true,
            enumerable: false,
          });
        }
      }
    }
    return body;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      data: error.response?.data?.data || null,
      response: error.response,
    };
    return Promise.reject(customError);
  }
);

export default api;
