require("dotenv").config();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const saltRounds = 10;
const { sendMail } = require('../utils/mail');

const createUserService = async (name, email, password) => {
    try {
        const user = await User.findOne({ email });
        if (user) {
            return {
                EC: 1,
                EM: `Email ${email} đã tồn tại`,
                DT: null
            };
        }

        const hashPassword = await bcrypt.hash(password, saltRounds);

        const result = await User.create({
            name,
            email,
            password: hashPassword,
            role: "User"
        });

        return {
            EC: 0,
            EM: "Tạo người dùng thành công",
            DT: {
                _id: result._id,
                name: result.name,
                email: result.email,
                role: result.role
            }
        };
    } catch (error) {
        console.log(error);
        return {
            EC: -1,
            EM: "Có lỗi xảy ra khi tạo người dùng",
            DT: null
        };
    }
}

const loginService = async (email1, password) => {
    try {
        const user = await User.findOne({ email: email1 });

        if (!user) {
            return { EC: 1, EM: "Email hoặc mật khẩu không hợp lệ", DT: null };
        }

        const isMatchPassword = await bcrypt.compare(password, user.password);
        if (!isMatchPassword) {
            return { EC: 2, EM: "Email hoặc mật khẩu không hợp lệ", DT: null };
        }

        const payload = {
            email: user.email,
            name: user.name
        };

        const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        return {
            EC: 0,
            EM: "Đăng nhập thành công",
            DT: {
                access_token,
                user: {
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        };
    } catch (error) {
        console.log(error);
        return {
            EC: -1,
            EM: "Có lỗi xảy ra khi đăng nhập",
            DT: null
        };
    }
}

const getUserService = async () => {
    try {
        const result = await User.find({}).select("-password");
        return {
            EC: 0,
            EM: "Lấy danh sách người dùng thành công",
            DT: result
        };
    } catch (error) {
        console.log(error);
        return {
            EC: -1,
            EM: "Có lỗi xảy ra khi lấy danh sách người dùng",
            DT: []
        };
    }
}

const forgotPasswordService = async (email) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return {
                EC: 1,
                EM: "Email không tồn tại trong hệ thống",
                DT: null
            };
        }

        const newPassword = crypto.randomBytes(4).toString('hex');
        const hashPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashPassword;
        await user.save();

        await sendMail({
            to: user.email,
            subject: 'Mật khẩu mới của bạn',
            html: `
                <p>Chào ${user.name || 'bạn'},</p>
                <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.</p>
            `,
        });

        return {
            EC: 0,
            EM: "Mật khẩu mới đã được gửi qua email",
            DT: null
        };
    } catch (error) {
        console.log(error);
        return {
            EC: -1,
            EM: "Có lỗi xảy ra khi xử lý quên mật khẩu",
            DT: null
        };
    }
}

module.exports = {
    createUserService,
    loginService,
    getUserService,
    forgotPasswordService
};

