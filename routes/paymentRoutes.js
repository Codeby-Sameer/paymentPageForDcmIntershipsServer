const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPayment
} = require('../controllers/paymentController');

// Payment routes
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/:orderId', getPayment);

module.exports = router;