const mongoose = require("mongoose");

const bookingHistorySchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },

    customerName: String,

    customerEmail: String,

    carName: String,

    totalAmount: Number,

    status: String,

    actionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const BookingHistory = mongoose.model(
  "BookingHistory",
  bookingHistorySchema
);
module.exports = BookingHistory;