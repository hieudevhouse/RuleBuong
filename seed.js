const mongoose = require('mongoose');
const User = require('./models/User');
const { Task, Expense, Note, Debt } = require('./models/Personal');
const { RoomFund, Fine, DutySchedule } = require('./models/Room');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to seed...');

        // Clear existing data
        await User.deleteMany({});
        await Task.deleteMany({});
        await Expense.deleteMany({});
        await Note.deleteMany({});
        await Debt.deleteMany({});
        await RoomFund.deleteMany({});
        await Fine.deleteMany({});
        await DutySchedule.deleteMany({});

        // Create Users
        const users = await User.create([
            { fullName: 'Anh Bếp Xoay', email: 'bepxoay@pencake.com', password: 'password123', role: 'user', room: 'Buồng Vui Vẻ' },
            { fullName: 'Ông Vệ Sinh', email: 'vesinh@pencake.com', password: 'password123', role: 'user', room: 'Buồng Vui Vẻ' },
            { fullName: 'Hieu Dev', email: 'hieu@pencake.com', password: 'password123', role: 'super_admin', room: 'Buồng Vui Vẻ' },
            { fullName: 'Master Giường', email: 'giuong@pencake.com', password: 'password123', role: 'user', room: 'Buồng Vui Vẻ' }
        ]);

        const admin = users.find(u => u.role === 'super_admin');
        const bepXoay = users.find(u => u.fullName === 'Anh Bếp Xoay');

        // Create Tasks
        await Task.create([
            { userId: admin._id, title: 'Hoàn thiện API Pencake', date: new Date(), status: 'pending', priority: 'high' },
            { userId: admin._id, title: 'Họp buồng tháng 5', date: new Date(), status: 'pending', priority: 'medium' }
        ]);

        // Create Expenses
        await Expense.create([
            { userId: admin._id, title: 'Ăn trưa', amount: 55000, category: 'Food' },
            { userId: admin._id, title: 'Xăng xe', amount: 100000, category: 'Transport' }
        ]);

        // Create Debt
        await Debt.create({
            creditorId: admin._id,
            debtorId: bepXoay._id,
            amount: 50000,
            description: 'Tiền trà sữa',
            status: 'pending'
        });

        // Room Fund
        await RoomFund.create([
            { type: 'income', amount: 1000000, description: 'Quỹ tháng 4', date: new Date() },
            { type: 'income', amount: 250000, description: 'Phạt muộn', date: new Date() }
        ]);

        // Fines
        await Fine.create({
            userId: bepXoay._id,
            amount: 20000,
            reason: 'Không rửa bát đúng hạn',
            status: 'unpaid'
        });

        console.log('✅ Seeding completed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
