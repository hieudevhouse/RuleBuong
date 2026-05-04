const { Expense, Note, Debt } = require('../models/Personal');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const moment = require('moment');

exports.getDashboard = async (req, res) => {
    try {
        const user = req.user;
        const today = moment().startOf('day');
        const startOfMonth = moment().startOf('month');

        // Today's Tasks
        const todayTasksCount = await Schedule.countDocuments({
            user: user._id,
            startTime: { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() }
        });

        // Monthly Expenses
        const monthlyExpenses = await Expense.aggregate([
            { $match: { userId: user._id, date: { $gte: startOfMonth.toDate() } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalMonthlyExpense = monthlyExpenses.length > 0 ? monthlyExpenses[0].total : 0;

        // Debts and Receivables (only pending/approved)
        const debtStats = await Debt.aggregate([
            { $match: { debtorId: user._id, status: { $in: ['pending', 'approved'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalDebt = debtStats.length > 0 ? debtStats[0].total : 0;

        const receivableStats = await Debt.aggregate([
            { $match: { creditorId: user._id, status: { $in: ['pending', 'approved'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalReceivable = receivableStats.length > 0 ? receivableStats[0].total : 0;

        const notes = await Note.find({ userId: user._id }).sort({ createdAt: -1 });

        res.render('personal/dashboard', {
            title: 'Bảng điều khiển cá nhân - Pencake',
            user,
            stats: {
                todayTasks: todayTasksCount,
                monthlyExpense: totalMonthlyExpense,
                debt: totalDebt,
                receivable: totalReceivable
            },
            notes,
            moment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.createNote = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: 'Content is required' });
            }
            return res.redirect('/personal/dashboard');
        }

        const newNote = new Note({
            userId: req.user._id,
            title: 'Ghi chú nhanh',
            content: content
        });
        await newNote.save();

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({ success: true, note: newNote });
        }
        
        res.redirect('/personal/dashboard');
    } catch (err) {
        console.error(err);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: 'Error creating note' });
        }
        res.status(500).send('Error creating note');
    }
};

exports.createDebt = async (req, res) => {
    try {
        const { debtorId, amount, description, dueDate } = req.body;
        const newDebt = new Debt({
            creditorId: req.user._id,
            debtorId,
            amount,
            description,
            dueDate,
            status: 'pending'
        });
        await newDebt.save();
        res.redirect('/personal/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating debt');
    }
};

exports.approveDebt = async (req, res) => {
    try {
        const { debtId } = req.params;
        await Debt.findByIdAndUpdate(debtId, { status: 'approved' });
        res.redirect('/personal/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error approving debt');
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const user = req.user;
        const expenses = await Expense.find({ userId: user._id }).sort({ date: -1 });
        
        // Debts and Receivables
        const myDebts = await Debt.find({ debtorId: user._id, status: 'approved' })
            .populate('creditorId', 'fullName qrCode');
        const othersOweMe = await Debt.find({ creditorId: user._id, status: 'approved' })
            .populate('debtorId', 'fullName');
        
        // Pending approval requests (Current user is the debtor, needs to approve)
        const pendingApprovals = await Debt.find({ debtorId: user._id, status: 'pending' })
            .populate('creditorId', 'fullName');

        // Paid/Completed history
        const paidHistory = await Debt.find({ 
            $or: [{ debtorId: user._id }, { creditorId: user._id }],
            status: 'completed'
        }).populate('creditorId debtorId', 'fullName').sort({ updatedAt: -1 });

        // All users for the creation modal
        const allUsers = await User.find({ _id: { $ne: user._id } }, 'fullName email');

        // Calculations
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const monthlyAmount = expenses
            .filter(exp => moment(exp.date).isSame(moment(), 'month'))
            .reduce((sum, exp) => sum + exp.amount, 0);
        const dailyAmount = expenses
            .filter(exp => moment(exp.date).isSame(moment(), 'day'))
            .reduce((sum, exp) => sum + exp.amount, 0);

        res.render('personal/expenses', {
            title: 'Quản lý chi tiêu - Pencake',
            user,
            expenses,
            myDebts,
            othersOweMe,
            pendingApprovals,
            paidHistory,
            allUsers,
            stats: {
                total: totalAmount,
                monthly: monthlyAmount,
                daily: dailyAmount
            },
            moment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải trang chi tiêu');
    }
};

exports.payDebt = async (req, res) => {
    try {
        const { debtId } = req.params;
        const updateData = { status: 'completed' };

        if (req.file) {
            updateData.paymentProof = req.file.path;
        }

        const debt = await Debt.findOne({ _id: debtId, debtorId: req.user._id });
        if (!debt) {
            return res.status(404).send('Không tìm thấy khoản nợ');
        }

        await Debt.findByIdAndUpdate(debtId, updateData);
        res.redirect('/personal/expenses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi thanh toán nợ');
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { title, amount, category, date, notes } = req.body;
        const newExpense = new Expense({
            userId: req.user._id,
            title,
            amount: parseFloat(amount.toString().replace(/\./g, '')),
            category,
            date: date ? new Date(date) : new Date(),
            notes
        });
        await newExpense.save();
        res.redirect('/personal/expenses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi thêm chi tiêu');
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await Expense.findOneAndDelete({ _id: id, userId: req.user._id });
        res.redirect('/personal/expenses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi xóa chi tiêu');
    }
};
