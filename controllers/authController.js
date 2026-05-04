const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

exports.getLogin = (req, res) => {
    res.render('auth/login', { title: 'Đăng nhập - Pencake', layout: 'layouts/auth' });
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.render('auth/login', { title: 'Đăng nhập - Pencake', layout: 'layouts/auth', error: 'Email hoặc mật khẩu không đúng.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        
        user.lastLogin = new Date();
        await user.save();

        res.redirect('/personal/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
};

exports.getRegister = (req, res) => {
    res.render('auth/register', { title: 'Đăng ký - Pencake', layout: 'layouts/auth' });
};

exports.postRegister = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('auth/register', { title: 'Đăng ký - Pencake', layout: 'layouts/auth', error: 'Mật khẩu xác nhận không khớp.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/register', { title: 'Đăng ký - Pencake', layout: 'layouts/auth', error: 'Email đã được sử dụng.' });
        }

        const user = new User({ 
            fullName, 
            email, 
            password,
            qrCode: req.file ? req.file.path : null
        });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.redirect('/personal/dashboard');
    } catch (err) {
        console.error(err);
        res.render('auth/register', { title: 'Đăng ký - Pencake', layout: false, error: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
};
