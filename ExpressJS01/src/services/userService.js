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
        if (error.code === 11000) {
            return {
                EC: 1,
                EM: `Email ${email} đã tồn tại`,
                DT: null
            };
        }
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

const getUserService = async (page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const [result, total] = await Promise.all([
            User.find({}).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments({})
        ]);

        return {
            EC: 0,
            EM: "Lấy danh sách người dùng thành công",
            DT: {
                users: result,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            }
        };
    } catch (error) {
        return {
            EC: -1,
            EM: "Có lỗi xảy ra khi lấy danh sách người dùng",
            DT: {
                users: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }
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

/**
 * Tìm kiếm user với Fuzzy Search và nhiều điều kiện lọc
 * @param {Object} searchParams - Tham số tìm kiếm
 * @param {String} searchParams.keyword - Từ khóa tìm kiếm (name, email)
 * @param {String} searchParams.role - Lọc theo role (User, Admin)
 * @param {Date} searchParams.createdFrom - Lọc từ ngày tạo
 * @param {Date} searchParams.createdTo - Lọc đến ngày tạo
 * @param {Number} searchParams.page - Trang hiện tại (mặc định: 1)
 * @param {Number} searchParams.limit - Số lượng mỗi trang (mặc định: 10)
 * @param {String} searchParams.sortBy - Sắp xếp theo field (name, email, createdAt)
 * @param {String} searchParams.sortOrder - Thứ tự sắp xếp (asc, desc)
 */
const searchUserService = async (searchParams = {}) => {
    try {
        const {
            keyword = '',
            role = '',
            createdFrom = null,
            createdTo = null,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = searchParams;

        // Xây dựng query filter
        const filter = {};

        // Fuzzy search cho keyword (tìm kiếm mờ trong name và email)
        if (keyword && keyword.trim() !== '') {
            const keywordRegex = new RegExp(keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { name: { $regex: keywordRegex } },
                { email: { $regex: keywordRegex } }
            ];
        }

        // Lọc theo role
        if (role && role.trim() !== '') {
            filter.role = role.trim();
        }

        // Lọc theo ngày tạo
        if (createdFrom || createdTo) {
            filter.createdAt = {};
            if (createdFrom) {
                filter.createdAt.$gte = new Date(createdFrom);
            }
            if (createdTo) {
                // Thêm 1 ngày để bao gồm cả ngày cuối
                const endDate = new Date(createdTo);
                endDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDate;
            }
        }

        // Xử lý pagination
        const skip = (page - 1) * limit;

        // Xử lý sort
        const sortOptions = {};
        const validSortFields = ['name', 'email', 'createdAt', 'role'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

        // Thực hiện query với aggregation để có thể tính điểm relevance
        let pipeline = [
            { $match: filter },
            { $project: { password: 0 } } // Loại bỏ password
        ];

        // Nếu có keyword, tính điểm relevance dựa trên độ khớp
        if (keyword && keyword.trim() !== '') {
            const keywordLower = keyword.trim().toLowerCase();
            const escapedKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            pipeline.push({
                $addFields: {
                    relevanceScore: {
                        $add: [
                            {
                                // Điểm cho name: exact match = 100, contains = 50
                                $cond: [
                                    { $eq: [{ $toLower: '$name' }, keywordLower] },
                                    100,
                                    {
                                        $cond: [
                                            { $regexMatch: { input: '$name', regex: escapedKeyword, options: 'i' } },
                                            50,
                                            0
                                        ]
                                    }
                                ]
                            },
                            {
                                // Điểm cho email: exact match = 100, contains = 50
                                $cond: [
                                    { $eq: [{ $toLower: '$email' }, keywordLower] },
                                    100,
                                    {
                                        $cond: [
                                            { $regexMatch: { input: '$email', regex: escapedKeyword, options: 'i' } },
                                            50,
                                            0
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            });
            // Sắp xếp theo relevance score trước, sau đó mới theo sortOptions
            pipeline.push({ $sort: { relevanceScore: -1, [sortField]: sortOrder === 'asc' ? 1 : -1 } });
        } else {
            pipeline.push({ $sort: sortOptions });
        }

        // Thêm pagination
        pipeline.push(
            { $skip: skip },
            { $limit: parseInt(limit) }
        );

        // Thực hiện query
        const [result, totalResult] = await Promise.all([
            User.aggregate(pipeline),
            User.countDocuments(filter)
        ]);

        return {
            EC: 0,
            EM: "Tìm kiếm người dùng thành công",
            DT: {
                users: result,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalResult / limit),
                    totalItems: totalResult,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < Math.ceil(totalResult / limit),
                    hasPrevPage: page > 1
                },
                filters: {
                    keyword: keyword || null,
                    role: role || null,
                    createdFrom: createdFrom || null,
                    createdTo: createdTo || null
                }
            }
        };
    } catch (error) {
        console.log('Search error:', error);
        return {
            EC: -1,
            EM: "Có lỗi xảy ra khi tìm kiếm người dùng",
            DT: {
                users: [],
                pagination: {
                    currentPage: parseInt(searchParams.page) || 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: parseInt(searchParams.limit) || 10,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }
        };
    }
}

module.exports = {
    createUserService,
    loginService,
    getUserService,
    forgotPasswordService,
    searchUserService
};

