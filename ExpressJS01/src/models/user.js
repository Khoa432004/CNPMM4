const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
}, {
    timestamps: true
});

// Tạo text index để hỗ trợ tìm kiếm
userSchema.index({ name: 'text', email: 'text' });

const User = mongoose.model('user', userSchema);

module.exports = User;

