const { createUserService, loginService, getUserService, forgotPasswordService } = require('../services/userService');

const createUser = async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({
            EC: 1,
            EM: "Thiếu thông tin name, email hoặc password",
            DT: null
        });
    }
    const data = await createUserService(name, email, password);
    const status = data?.EC === 0 ? 200 : 400;
    return res.status(status).json(data);
}

const handleLogin = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({
            EC: 1,
            EM: "Thiếu thông tin email hoặc password",
            DT: null
        });
    }
    const data = await loginService(email, password);
    const status = data?.EC === 0 ? 200 : 400;
    return res.status(status).json(data);
}

const getUser = async (req, res) => {
    const data = await getUserService();
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
    const { email } = req.body || {};
    if (!email) {
        return res.status(400).json({
            EC: 1,
            EM: "Thiếu thông tin email",
            DT: null
        });
    }
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

