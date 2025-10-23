const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/payment');
const { Courses } = require('../utilities/courses');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
const createOrder = async (req, res) => {
    try {
        const { name, email, phone, department, semester,program, rollNumber, course, amount,college } = req.body;
        console.log(req.body)

        // Validate required fields
        if (!name || !email || !phone || !department || !semester || !rollNumber || !course || !program || !amount || !college) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
 const existingPayment = await Payment.findOne({
      email,
      rollNumber,
      program: program,
     status: { $nin: ['created', 'failed'] } // Optional: exclude failed attempts
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'Payment already exists for this program'
      });
    }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }
        
        const selectedCourse = Courses.find(c => c.name === program);
        console.log(selectedCourse)
        const options = {
            amount: selectedCourse.amount * 100, // amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${rollNumber}`,
            notes: {
                name,
                email,
                phone,
                department,
                semester,
                rollNumber,
                course,
                program,
                college
            }
        };

        // Create order in Razorpay
        const order = await razorpay.orders.create(options);

        // Save payment record in database
        const payment = new Payment({
            name,
            email,
            phone,
            department,
            semester,
            rollNumber,
            course,
            amount,
            program,
            college,
            razorpayOrderId: order.id,
            receipt: options.receipt,
            status: 'created'
        });

        await payment.save();

        res.json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            key: process.env.RAZORPAY_KEY_ID,
            student: {
                name,
                email,
                rollNumber,
                course
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Verify payment
const verifyPayment = async (req, res) => {
    console.log("hittted verify")
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
console.log(req.body)
        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update payment status
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.status = 'paid';
            await payment.save();

            res.json({
                success: true,
                message: 'Payment verified successfully!',
                paymentId: razorpay_payment_id,
                student: {
                    name: payment.name,
                    email: payment.email,
                    rollNumber: payment.rollNumber,
                    course: payment.course,
                    amount: payment.amount
                },
                receipt: payment.receipt
            });
        } else {
            payment.status = 'failed';
            await payment.save();

            res.status(400).json({
                success: false,
                message: 'Payment verification failed - Invalid signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// Webhook handler
const handleWebhook = async (req, res) => {
    try {
        const secret = process.env.WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest === signature) {
            const event = req.body.event;
            const payload = req.body.payload;

            if (event === 'payment.captured') {
                const paymentData = payload.payment.entity;
                
                // Update payment status in database
                await Payment.findOneAndUpdate(
                    { razorpayOrderId: paymentData.order_id },
                    {
                        razorpayPaymentId: paymentData.id,
                        status: 'paid'
                    }
                );

                console.log(`Payment captured for order: ${paymentData.order_id}`);
            }

            res.json({ status: 'ok' });
        } else {
            console.error('Webhook signature verification failed');
            res.status(400).json({ status: 'error', message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
};

// Get payment by ID
const getPayment = async (req, res) => {
    try {
        const payment = await Payment.findOne({ razorpayOrderId: req.params.orderId });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPayment
};