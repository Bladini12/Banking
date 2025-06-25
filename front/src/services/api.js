import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true, // if you're using cookies for auth
});


// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
                    refresh: refreshToken,
                });

                if (response.data.access) {
                    localStorage.setItem('access', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                } else {
                    throw new Error('No access token in refresh response');
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth endpoints
export const register = (data) => api.post('/auth/register/', data);
export const login = (data) => api.post('/auth/login/', data);
export const refreshToken = (data) => api.post('/auth/token/refresh/', data);

// User endpoints
export const getProfile = async () => {
    try {
        const response = await api.get('/auth/profile/');
        return response;
    } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            window.location.href = '/login';
        }
        throw error;
    }
};

export const updateProfile = (data) => api.put('/auth/profile/', data);

// Transaction endpoints
export const getTransactions = async () => {
    try {
        const response = await api.get('/auth/transactions/');
        return response;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            window.location.href = '/login';
        }
        throw error;
    }
};

export const getTransaction = (id) => api.get(`/auth/transactions/${id}/`);
export const deposit = (data) => api.post('/auth/deposit/', data);
export const loan = (data) => api.post('/auth/loan/', data);
export const transfer = (data) => api.post('/auth/transfer/', data);

export default api; 
