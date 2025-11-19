const User = require('../models/user');

const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({
                EC: 1,
                EM: 'Bạn chưa đăng nhập'
            });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({
                EC: 1,
                EM: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'Admin') {
            return res.status(403).json({
                EC: 1,
                EM: 'Bạn không có quyền truy cập tài nguyên này. Chỉ Admin mới có quyền.'
            });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EC: -1,
            EM: 'Lỗi server khi kiểm tra quyền'
        });
    }
};

const isUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({
                EC: 1,
                EM: 'Bạn chưa đăng nhập'
            });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({
                EC: 1,
                EM: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'User' && user.role !== 'Admin') {
            return res.status(403).json({
                EC: 1,
                EM: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EC: -1,
            EM: 'Lỗi server khi kiểm tra quyền'
        });
    }
};

const isUserOrAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({
                EC: 1,
                EM: 'Bạn chưa đăng nhập'
            });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({
                EC: 1,
                EM: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'User' && user.role !== 'Admin') {
            return res.status(403).json({
                EC: 1,
                EM: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EC: -1,
            EM: 'Lỗi server khi kiểm tra quyền'
        });
    }
};

module.exports = {
    isAdmin,
    isUser,
    isUserOrAdmin
};

