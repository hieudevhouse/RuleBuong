const User = require('../models/User');

exports.getProfile = async (req, res) => {
    res.render('personal/profile', {
        title: 'Hồ sơ cá nhân - Pencake',
        user: req.user
    });
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullName } = req.body;
        const updateData = { fullName };

        if (req.files) {
            if (req.files['avatar']) {
                updateData.avatar = req.files['avatar'][0].path;
            }
            if (req.files['qrCode']) {
                updateData.qrCode = req.files['qrCode'][0].path;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
        
        // Cập nhật lại thông tin trong session/req.user
        req.user = updatedUser;
        res.locals.user = updatedUser;

        res.redirect('/personal/profile?success=true');
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).send('Lỗi cập nhật hồ sơ');
    }
};
