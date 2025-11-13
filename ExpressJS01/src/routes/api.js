const express = require('express');
const { createUser, handleLogin, getUser, getAccount, forgotPassword } = require('../controllers/userController');
const auth = require('../middleware/auth');
const delay = require('../middleware/delay');

const routerAPI = express.Router();

routerAPI.get("/", (req, res) => {
    res.status(200).json("Đỗ Nguyễn Đăng Khoa! Hello world! HomePage API");
});

routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);
routerAPI.post("/forgot-password", forgotPassword);

routerAPI.use(auth);

routerAPI.get("/user", getUser);
routerAPI.get("/account", delay, getAccount);

module.exports = routerAPI;

