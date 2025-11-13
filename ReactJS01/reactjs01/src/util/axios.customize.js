import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080',
});

instance.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    },
);

instance.interceptors.response.use(
    function (response) {
        if (response && response.data) return response.data;
        return response;
    },
    function (error) {
        if (error?.response?.data) return error.response.data;
        return Promise.reject(error);
    },
);

export default instance;

