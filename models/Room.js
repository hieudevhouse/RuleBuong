const mongoose = require('mongoose');

// Room Fund Management
const roomFundSchema = new mongoose.Schema({
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Người đóng hoặc người chi
    date: { type: Date, default: Date.now }
}, { timestamps: true });

// Fine Management (linked to PayOS)
const fineSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    originalAmount: { type: Number, required: true },
    reason: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['unpaid', 'paid', 'pending_approval'], default: 'unpaid' },
    payosOrderCode: { type: Number },
    paymentDate: { type: Date },
    lastFeeUpdate: { type: Date, default: Date.now } // Ngày cuối cùng cập nhật tiền phạt chậm
}, { timestamps: true });

// Boarding House Rules (Nội quy)
const roomRuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    fineAmount: { type: Number, default: 0 },
    category: { type: String, default: 'General' }
}, { timestamps: true });

// Duty Schedule (Lịch trực nhật)
const dutyScheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    task: { type: String, default: 'Dọn vệ sinh / Nấu ăn' },
    status: { type: String, enum: ['pending', 'completed', 'missed'], default: 'pending' }
}, { timestamps: true });

// Shared Purchases (Mua đồ chung)
const sharedPurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true },
    amount: { type: Number, required: true },
    image: { type: String }, // URL ảnh minh họa hoặc hóa đơn
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved'], default: 'approved' } // Mặc định duyệt luôn cho đơn giản
}, { timestamps: true });

module.exports = {
    RoomFund: mongoose.model('RoomFund', roomFundSchema),
    Fine: mongoose.model('Fine', fineSchema),
    DutySchedule: mongoose.model('DutySchedule', dutyScheduleSchema),
    RoomRule: mongoose.model('RoomRule', roomRuleSchema),
    SharedPurchase: mongoose.model('SharedPurchase', sharedPurchaseSchema)
};
