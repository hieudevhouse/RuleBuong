const { RoomFund, Fine, DutySchedule, RoomRule, SharedPurchase } = require('../models/Room');
const { PayOS } = require('@payos/node');
const User = require('../models/User');
const moment = require('moment');
require('dotenv').config();

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

exports.getDashboard = async (req, res) => {
    try {
        const user = req.user;
        const today = moment().startOf('day');
        
        const members = await User.find({ room: 'Buồng Vui Vẻ' });
        
        // Today's Duty
        const todayDuty = await DutySchedule.findOne({ 
            date: { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() } 
        }).populate('userId', 'fullName avatar');

        // Weekly Duties
        const startOfWeek = moment().startOf('week').add(1, 'day');
        const endOfWeek = moment().endOf('week').add(1, 'day');
        const weeklyDuties = await DutySchedule.find({
            date: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
        }).populate('userId', 'fullName');

        // Fund calculation
        const incomes = await RoomFund.find({ type: 'income' });
        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const expenses = await RoomFund.find({ type: 'expense' });
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        const currentFund = totalIncome - totalExpense;
        
        // 3. Tiền phạt chưa đóng & Lịch sử vi phạm
        const fines = await Fine.find()
            .populate('userId', 'fullName avatar')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        const totalUnpaidFines = fines
            .filter(f => f.status === 'unpaid')
            .reduce((sum, f) => sum + f.amount, 0);

        // 4. Lịch sử thu chi
        const fundHistory = await RoomFund.find()
            .populate('userId', 'fullName')
            .sort({ date: -1 })
            .limit(10);

        // 5. Nội quy
        const rules = await RoomRule.find();
        const allUsers = await User.find({ role: 'user' });

        // 6. Mua đồ chung (Shared Purchases)
        const sharedPurchases = await SharedPurchase.find()
            .populate('userId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .limit(10);

        res.render('room/dashboard', {
            title: 'Dashboard Phòng - Pencake',
            user,
            currentFund,
            todayDuty,
            weeklyDuties,
            totalUnpaidFines,
            fines,
            fundHistory,
            members,
            rules,
            allUsers,
            sharedPurchases,
            moment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải dữ liệu phòng');
    }
};

exports.createFine = async (req, res) => {
    try {
        const { userId, reason, amount } = req.body;
        
        await Fine.create({
            userId,
            reason,
            amount,
            originalAmount: amount,
            createdBy: req.user._id, // Lưu người gán lỗi
            lastFeeUpdate: new Date()
        });

        res.redirect('/room/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi ghi nhận vi phạm');
    }
};

exports.getFinesPage = async (req, res) => {
    try {
        const user = req.user;
        const now = moment();

        // Find unpaid fines for current user
        let myFines = await Fine.find({ userId: user._id, status: 'unpaid' });

        // Logic tăng 2.5% mỗi ngày
        for (let fine of myFines) {
            const lastUpdate = moment(fine.lastFeeUpdate);
            const daysDiff = now.diff(lastUpdate, 'days');

            if (daysDiff > 0) {
                // Tăng 2.5% cho mỗi ngày trôi qua
                let newAmount = fine.amount;
                for (let i = 0; i < daysDiff; i++) {
                    newAmount = newAmount * 1.025;
                }
                fine.amount = Math.round(newAmount);
                fine.lastFeeUpdate = now.toDate();
                await fine.save();
            }
        }

        const paidHistory = await Fine.find({ userId: user._id, status: 'paid' }).sort({ paymentDate: -1 });

        res.render('room/fines', {
            title: 'Vi phạm & Thanh toán - Pencake',
            user,
            myFines,
            paidHistory,
            moment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải trang vi phạm');
    }
};

exports.createFinePayment = async (req, res) => {
    try {
        const { fineId } = req.params;
        const fine = await Fine.findById(fineId);
        
        if (!fine) return res.status(404).send('Không tìm thấy vi phạm');

        // PayOS requires orderCode to be a number.
        const orderCode = Number(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
        
        const paymentBody = {
            orderCode: orderCode,
            amount: Math.round(fine.amount),
            description: `Pencake Pay: ${fine.reason.slice(0, 15)}`,
            items: [
                {
                    name: fine.reason.slice(0, 20),
                    quantity: 1,
                    price: Math.round(fine.amount)
                }
            ],
            returnUrl: `${req.protocol}://${req.get('host')}/room/payment-success?fineId=${fineId}`,
            cancelUrl: `${req.protocol}://${req.get('host')}/room/fines`,
        };

        const paymentLink = await payos.paymentRequests.create(paymentBody);

        fine.payosOrderCode = orderCode;
        await fine.save();

        res.redirect(paymentLink.checkoutUrl);
    } catch (err) {
        console.error('--- PAYOS INITIALIZATION ERROR ---');
        console.error('Error Details:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
        res.status(500).send('Lỗi khởi tạo thanh toán: ' + err.message);
    }
};

exports.handlePaymentSuccess = async (req, res) => {
    try {
        const { fineId } = req.query;
        if (!fineId) return res.redirect('/room/fines');

        const fine = await Fine.findById(fineId).populate('userId', 'fullName').populate('createdBy', 'fullName');
        if (fine && fine.status !== 'paid') {
            fine.status = 'paid';
            fine.paymentDate = new Date();
            await fine.save();

            // Cộng vào quỹ phòng với thông tin chi tiết
            await RoomFund.create({
                type: 'income',
                amount: fine.amount,
                description: `Thu tiền phạt: ${fine.reason} | Bị phạt: ${fine.userId.fullName} | Người gán: ${fine.createdBy ? fine.createdBy.fullName : 'Hệ thống'}`,
                userId: fine.userId,
                date: new Date()
            });
        }

        res.render('room/payment-success', {
            title: 'Thanh toán thành công - Pencake',
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi xử lý thanh toán');
    }
};
exports.getRulesPage = async (req, res) => {
    try {
        res.render('room/rules', {
            layout: false, // Don't use the main layout for this specific page as it has its own
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải trang nội quy');
    }
};

exports.getPurchasesPage = async (req, res) => {
    try {
        const user = req.user;
        const sharedPurchases = await SharedPurchase.find()
            .populate('userId', 'fullName avatar')
            .sort({ createdAt: -1 });

        res.render('room/purchases', {
            title: 'Mua đồ chung - Pencake',
            user,
            sharedPurchases,
            moment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải trang mua đồ chung');
    }
};

exports.createSharedPurchase = async (req, res) => {
    try {
        const { productName, amount } = req.body;
        const imageUrl = req.file ? req.file.path : null;

        await SharedPurchase.create({
            userId: req.user._id,
            productName,
            amount: Number(amount),
            image: imageUrl,
            status: 'approved'
        });

        // Đã gỡ bỏ phần tự động trừ quỹ phòng theo yêu cầu người dùng
        
        res.redirect('/room/purchases');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi ghi nhận mua đồ chung');
    }
};

exports.createFundExpense = async (req, res) => {
    try {
        const { description, amount } = req.body;
        
        await RoomFund.create({
            type: 'expense',
            amount: Number(amount),
            description: `${description} (Người chi: ${req.user.fullName})`,
            userId: req.user._id,
            date: new Date()
        });

        res.redirect('/room/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi ghi nhận sử dụng quỹ');
    }
};
