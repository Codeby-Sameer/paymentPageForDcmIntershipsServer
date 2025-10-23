require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/ConnectDB');

// Route imports
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Webhook needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/payments', paymentRoutes);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

// 404 handler
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({
            success: false,
            message: 'API route not found'
        });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});