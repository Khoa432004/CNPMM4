const rateLimit = require('express-rate-limit');

const createAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        EC: 1,
        EM: 'Quá nhiều lần tạo tài khoản từ IP này, vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        EC: 1,
        EM: 'Quá nhiều lần đăng nhập từ IP này, vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        EC: 1,
        EM: 'Quá nhiều lần yêu cầu quên mật khẩu từ IP này, vui lòng thử lại sau 1 giờ.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        EC: 1,
        EM: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    createAccountLimiter,
    loginLimiter,
    forgotPasswordLimiter,
    apiLimiter
};

