const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

exports.requireAuth = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.redirect('/auth/login');
        }
        
        req.user = user;
        // Make user available in all EJS templates
        res.locals.user = user;
        next();
    } catch (err) {
        res.clearCookie('token');
        res.redirect('/auth/login');
    }
};
