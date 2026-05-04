const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

const { upload } = require('../config/cloudinary');

router.get('/dashboard', roomController.getDashboard);
router.get('/rules', roomController.getRulesPage);
router.post('/fine/create', roomController.createFine);
router.get('/fines', roomController.getFinesPage);
router.get('/pay-fine/:fineId', roomController.createFinePayment);
router.get('/payment-success', roomController.handlePaymentSuccess);
router.get('/purchases', roomController.getPurchasesPage);
router.post('/purchase/create', upload.single('image'), roomController.createSharedPurchase);
router.post('/fund/expense/create', roomController.createFundExpense);

module.exports = router;
