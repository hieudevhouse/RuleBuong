const mongoose = require('mongoose');

// Personal Task / Work Schedule
const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Personal Expense
const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'General' },
    date: { type: Date, default: Date.now },
    notes: { type: String }
}, { timestamps: true });

// Personal Note
const noteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String },
    color: { type: String, default: '#ffffff' }
}, { timestamps: true });

// Debt Management
const debtSchema = new mongoose.Schema({
    creditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người cho vay
    debtorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Người nợ
    amount: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected', 'completed'], default: 'pending' },
    dueDate: { type: Date },
    paymentProof: { type: String }
}, { timestamps: true });

module.exports = {
    Task: mongoose.model('Task', taskSchema),
    Expense: mongoose.model('Expense', expenseSchema),
    Note: mongoose.model('Note', noteSchema),
    Debt: mongoose.model('Debt', debtSchema)
};
