const { createUserService, loginService, getUserService, forgotPasswordService, searchUserService } = require('../services/userService');
const { searchUserWithElasticsearch } = require('../services/elasticsearchService');

const createUser = async (req, res) => {
    const { name, email, password } = req.body;
    const data = await createUserService(name, email, password);
    const status = data?.EC === 0 ? 200 : 400;
    return res.status(status).json(data);
}

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    const data = await loginService(email, password);
    const status = data?.EC === 0 ? 200 : 400;
    return res.status(status).json(data);
}

const getUser = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await getUserService(page, limit);
    const status = data?.EC === 0 ? 200 : 400;
    return res.status(status).json(data);
}

const getAccount = async (req, res) => {
    return res.status(200).json({
        EC: 0,
        EM: "Lấy thông tin tài khoản thành công",
        DT: req.user
    });
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const data = await forgotPasswordService(email);
    const status = data?.EC === 0 ? 200 : 400;
    return res.status(status).json(data);
}

const searchUser = async (req, res) => {
    try {
        // Lấy các tham số từ query string
        const {
            keyword = '',
            role = '',
            createdFrom = null,
            createdTo = null,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            useElasticsearch = false // Tùy chọn sử dụng Elasticsearch
        } = req.query;

        const searchParams = {
            keyword: keyword.trim(),
            role: role.trim(),
            createdFrom,
            createdTo,
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder
        };

        // Sử dụng Elasticsearch nếu được yêu cầu và có cấu hình
        let data;
        if (useElasticsearch === 'true' || useElasticsearch === true) {
            data = await searchUserWithElasticsearch(searchParams);
        } else {
            // Mặc định sử dụng MongoDB Fuzzy Search
            data = await searchUserService(searchParams);
        }

        const status = data?.EC === 0 ? 200 : 400;
        return res.status(status).json(data);
    } catch (error) {
        console.log('Search controller error:', error);
        return res.status(500).json({
            EC: -1,
            EM: "Có lỗi xảy ra khi xử lý tìm kiếm",
            DT: null
        });
    }
}

module.exports = {
    createUser,
    handleLogin,
    getUser,
    getAccount,
    forgotPassword,
    searchUser
};

