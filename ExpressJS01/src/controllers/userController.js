const { createUserService, loginService, getUserService, forgotPasswordService } = require('../services/userService');

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

module.exports = {
    createUser,
    handleLogin,
    getUser,
    getAccount,
    forgotPassword
};

