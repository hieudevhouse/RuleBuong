const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { upload } = require('../config/cloudinary');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', upload.single('qrCode'), authController.postRegister);

router.get('/logout', authController.logout);

module.exports = router;
