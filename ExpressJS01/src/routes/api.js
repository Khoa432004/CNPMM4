const express = require('express');
const { createUser, handleLogin, getUser, getAccount, forgotPassword } = require('../controllers/userController');
const auth = require('../middleware/auth');
const delay = require('../middleware/delay');
const { validateRegister, validateLogin, validateForgotPassword } = require('../middleware/validation');
const { createAccountLimiter, loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');
const { isAdmin, isUserOrAdmin } = require('../middleware/authorization');

const routerAPI = express.Router();

routerAPI.get("/", (req, res) => {
    res.status(200).json("Đỗ Nguyễn Đăng Khoa! Hello world! HomePage API");
});

routerAPI.post("/register", createAccountLimiter, validateRegister, createUser);
routerAPI.post("/login", loginLimiter, validateLogin, handleLogin);
routerAPI.post("/forgot-password", forgotPasswordLimiter, validateForgotPassword, forgotPassword);

routerAPI.use(auth);

routerAPI.get("/user", isAdmin, getUser);
routerAPI.get("/account", isUserOrAdmin, delay, getAccount);

module.exports = routerAPI;

