import axios from './axios.customize';

const createUserApi = (name, email, password) => {
    const URL_API = '/v1/api/register';
    const data = { name, email, password };
    return axios.post(URL_API, data);
};

const loginApi = (email, password) => {
    const URL_API = '/v1/api/login';
    const data = { email, password };
    return axios.post(URL_API, data);
};

const getUserApi = (page = 1, limit = 10) => {
    const URL_API = '/v1/api/user';
    return axios.get(URL_API, { params: { page, limit } });
};

const forgotPasswordApi = (email) => {
    const URL_API = '/v1/api/forgot-password';
    return axios.post(URL_API, { email });
};

export {
    createUserApi,
    loginApi,
    getUserApi,
    forgotPasswordApi
};

