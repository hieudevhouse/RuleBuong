const express = require('express');
const router = express.Router();
const personalController = require('../controllers/personalController');
const profileController = require('../controllers/profileController');
const scheduleController = require('../controllers/scheduleController');
const { upload } = require('../config/cloudinary');

router.get('/dashboard', personalController.getDashboard);
router.post('/note/create', personalController.createNote);
router.get('/expenses', personalController.getExpenses);
router.post('/expenses/create', personalController.createExpense);
router.post('/expenses/delete/:id', personalController.deleteExpense);
router.post('/debt/create', personalController.createDebt);
router.post('/debt/approve/:debtId', personalController.approveDebt);
router.post('/debt/pay/:debtId', upload.single('paymentProof'), personalController.payDebt);

// Profile routes
router.get('/profile', profileController.getProfile);
router.post('/profile', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 }
]), profileController.updateProfile);

// Schedule routes
router.get('/schedule', scheduleController.getSchedule);
router.post('/schedule/create', scheduleController.createTask);
router.post('/schedule/update/:taskId', scheduleController.updateTask);
router.post('/schedule/delete/:taskId', scheduleController.deleteTask);
router.post('/schedule/toggle/:taskId', scheduleController.toggleComplete);

module.exports = router;
