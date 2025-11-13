require('dotenv').config();
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const white_lists = ["/", "/register", "/login", "/forgot-password"];
    const path = req.path || req.originalUrl.replace("/v1/api", "");

    if (white_lists.includes(path)) {
        return next();
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                email: decoded.email,
                name: decoded.name,
                createdBy: "hoidanit"
            };
            next();
        } catch (error) {
            return res.status(401).json({
                EC: 1,
                EM: "Token bị hết hạn hoặc không hợp lệ"
            });
        }
    } else {
        return res.status(401).json({
            EC: 1,
            EM: "Bạn chưa truyền Access Token ở header/Hoặc token bị hết hạn"
        });
    }
}

module.exports = auth;

