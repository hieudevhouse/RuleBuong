const Schedule = require('../models/Schedule');
const moment = require('moment');

exports.getSchedule = async (req, res) => {
    try {
        const selectedDate = req.query.date || moment().format('YYYY-MM-DD');
        const startOfDay = moment(selectedDate).startOf('day').toDate();
        const endOfDay = moment(selectedDate).endOf('day').toDate();

        const tasks = await Schedule.find({
            user: req.user._id,
            startTime: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ startTime: 1 });

        res.render('personal/schedule', {
            title: 'Lịch làm việc - Pencake',
            user: req.user,
            tasks,
            selectedDate,
            moment
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi tải lịch làm việc');
    }
};

exports.createTask = async (req, res) => {
    try {
        const { title, date, startTime, duration } = req.body;
        
        const start = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').toDate();
        const end = moment(start).add(duration, 'hours').toDate();

        const newTask = new Schedule({
            user: req.user._id,
            title,
            startTime: start,
            endTime: end
        });

        await newTask.save();
        res.redirect(`/personal/schedule?date=${date}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi thêm lịch làm việc');
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, date, startTime, duration } = req.body;
        
        const start = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').toDate();
        const end = moment(start).add(duration, 'hours').toDate();

        await Schedule.findOneAndUpdate({ _id: taskId, user: req.user._id }, {
            title,
            startTime: start,
            endTime: end
        });

        res.redirect(`/personal/schedule?date=${date}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi cập nhật lịch');
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { date } = req.query;
        await Schedule.findOneAndDelete({ _id: taskId, user: req.user._id });
        res.redirect(`/personal/schedule?date=${date}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi xóa lịch');
    }
};

exports.toggleComplete = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { date } = req.query;
        const task = await Schedule.findOne({ _id: taskId, user: req.user._id });
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            await task.save();
        }
        res.redirect(`/personal/schedule?date=${date}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi trạng thái lịch');
    }
};
