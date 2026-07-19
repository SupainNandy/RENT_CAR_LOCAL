const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const PaymentModel = require("../module/payment.model");
const bookingModel = require("../module/booking.model");
const sendPaymentReceipt = require("../utils/sendPaymentReceipt");

const paymentRouter = express.Router();

// Keep the same key/secret for creating the order and verifying payment.
const RAZORPAY_KEY_ID = "rzp_test_T7hm9BL1wPK6Jd";
const RAZORPAY_KEY_SECRET = "t6YTkB02N3foZoSQRXb021ku";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// CREATE RAZORPAY ORDER
paymentRouter.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // convert into paise (rupee * 100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.log("CREATE ORDER ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// VERIFY RAZORPAY PAYMENT + UPDATE BOOKING + SEND RECEIPT EMAIL
paymentRouter.post("/verify", async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const booking = await bookingModel
      .findById(bookingId)
      .populate("userId")
      .populate("carId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const existingPayment = await PaymentModel.findOne({
      transactionId: razorpay_payment_id,
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment: existingPayment,
        booking,
      });
    }

    const payment = await PaymentModel.create({
      bookingId: booking._id,
      amount: booking.totalAmount,
      transactionId: razorpay_payment_id,
      paymentStatus: "completed",
    });

    // IMPORTANT:
    // Your Booking model enum must include:
    // ["Pending", "Approved", "Rejected", "Cancelled"]
    booking.paymentStatus = "Paid";
    booking.bookingStatus = "Approved";
    booking.transactionId = razorpay_payment_id;

    await booking.save();

    // Receipt email should not fail the payment if Gmail has an error.
    try {
      await sendPaymentReceipt({
        userEmail: booking.userId?.email,
        userName: booking.userId?.name || "Customer",
        booking,
        paymentId: razorpay_payment_id,
      });

      console.log("Receipt email sent to:", booking.userId?.email);
    } catch (mailError) {
      console.log("RECEIPT EMAIL ERROR:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
      booking,
    });
  } catch (error) {
    console.log("VERIFY ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET PAYMENT HISTORY
paymentRouter.get("/", async (req, res) => {
  try {
    const payments = await PaymentModel.find()
      .populate({
        path: "bookingId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "carId", select: "brand model" },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.log("PAYMENT HISTORY ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// BYPASS/SIMULATE RAZORPAY PAYMENT (FOR DEV / MOCK TESTING)
paymentRouter.post("/bypass", async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await bookingModel
      .findById(bookingId)
      .populate("userId")
      .populate("carId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if payment already exists for this booking to avoid duplicate records
    const existingPayment = await PaymentModel.findOne({
      bookingId: booking._id,
      paymentStatus: "completed"
    });

    if (existingPayment) {
      booking.paymentStatus = "Paid";
      booking.bookingStatus = "Approved";
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Payment already completed",
        payment: existingPayment,
        booking,
      });
    }

    const mockPaymentId = `pay_mock_${crypto.randomBytes(8).toString("hex")}`;

    const payment = await PaymentModel.create({
      bookingId: booking._id,
      amount: booking.totalAmount,
      transactionId: mockPaymentId,
      paymentStatus: "completed",
    });

    booking.paymentStatus = "Paid";
    booking.bookingStatus = "Approved";
    booking.transactionId = mockPaymentId;

    await booking.save();

    // Send receipt email in a try-catch so failures don't block response
    try {
      await sendPaymentReceipt({
        userEmail: booking.userId?.email,
        userName: booking.userId?.name || "Customer",
        booking,
        paymentId: mockPaymentId,
      });
      console.log("Mock receipt email sent to:", booking.userId?.email);
    } catch (mailError) {
      console.log("MOCK RECEIPT EMAIL ERROR:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Test payment completed successfully (Mock Bypass)",
      payment,
      booking,
    });
  } catch (error) {
    console.log("BYPASS PAYMENT ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = paymentRouter;