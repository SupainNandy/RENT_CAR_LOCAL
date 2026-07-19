const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        carId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Car",
            required: true
        },

        pickupDate: {
            type: Date,
            required: true
        },

        returnDate: {
            type: Date,
            required: true
        },

        totalAmount: {
            type: Number,
            required: true
        },
        
        pickupDate: Date,
        returnDate: Date,

        totalAmount: Number,

        bookingStatus: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
                "Cancelled"

            ],
            default: "Pending"
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid","Failed"],
            default: "Pending",
        },
        transactionId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
)

const bookingModel = mongoose.model(
    "Booking",
    bookingSchema
)
module.exports = bookingModel;  