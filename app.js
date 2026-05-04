const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

// Routes
const authRoutes = require('./routes/auth');
const personalRoutes = require('./routes/personal');
const roomRoutes = require('./routes/room');
const { requireAuth } = require('./middleware/auth');

app.use('/auth', authRoutes);
app.use('/personal', requireAuth, personalRoutes);
app.use('/room', requireAuth, roomRoutes);

app.get('/', (req, res) => {
    res.redirect('/personal/dashboard');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
