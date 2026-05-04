const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    category: { type: String, default: 'personal' },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
