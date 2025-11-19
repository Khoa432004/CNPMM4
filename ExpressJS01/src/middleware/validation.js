const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            EC: 1,
            EM: 'Dữ liệu đầu vào không hợp lệ',
            DT: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Tên không được để trống')
        .isLength({ min: 2, max: 50 }).withMessage('Tên phải có từ 2 đến 50 ký tự')
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/).withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ')
        .isLength({ max: 100 }).withMessage('Email không được vượt quá 100 ký tự')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6, max: 50 }).withMessage('Mật khẩu phải có từ 6 đến 50 ký tự')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mật khẩu phải có chữ hoa, chữ thường và số'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    handleValidationErrors
];

const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword
};

