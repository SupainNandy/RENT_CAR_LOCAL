const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },

    amount: Number,

    transactionId: String,

    paymentStatus: {
      type: String,
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);