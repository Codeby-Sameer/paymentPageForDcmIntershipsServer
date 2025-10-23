const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    program:{type: String,
        required: [true, 'Program is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    semester: {
        type: String,
        required: [true, 'Semester is required'],
        trim: true
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        trim: true
    },
    course: {
        type: String,
        required: [true, 'Course is required'],
        trim: true
    },
    college: {
        type: String,
        required: [true, 'College is required'],
        trim: true
    },
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true
    },
    razorpaySignature: {
        type: String,
        sparse: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed'],
        default: 'created'
    },
    receipt: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ email: 1 });
paymentSchema.index({ rollNumber: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);