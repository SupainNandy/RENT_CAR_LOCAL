const express = require("express");
const adminRouter = express.Router();
const adminModel = require("../module/admin.model");
const userModel = require("../module/user.model");
const bookingModel = require("../module/booking.model");
const CarModel = require("../module/car.model");
const authMiddleware = require("../middleware/AuthMiddleware");
const BookingHistory = require("../module/bookingHistory.model");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= ADMIN REGISTER =================
adminRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const adminExist = await adminModel.findOne({ email });

    if (adminExist) {
      return res.status(400).json({
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await adminModel.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Admin registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ================= ADMIN LOGIN =================
adminRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminModel.findOne({
      email,
    });

    if (!admin) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    const match = await bcrypt.compare(
      password,
      admin.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      token,
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ================= DASHBOARD =================
adminRouter.get(
  "/dashboard",
  authMiddleware.authAdmin,
  async (req, res) => {
    try {
      const totalCars =
        await CarModel.countDocuments();

      const availableCars =
        await CarModel.countDocuments({
          available: true,
        });

      const bookedCars =
        await CarModel.countDocuments({
          available: false,
        });

      const totalUsers =
        await userModel.countDocuments();

      const totalBookings =
        await bookingModel.countDocuments();

      const pendingBookings =
        await bookingModel.countDocuments({
          bookingStatus: "Pending",
        });

      res.json({
        totalCars,
        availableCars,
        bookedCars,
        totalUsers,
        totalBookings,
        pendingBookings,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ================= GET USERS =================
adminRouter.get(
  "/users",
  authMiddleware.authAdmin,
  async (req, res) => {
    const users = await userModel.find();

    res.json(users);
  }
);

// ================= GET BOOKINGS =================
adminRouter.get(
  "/bookings",
  authMiddleware.authAdmin,
  async (req, res) => {
    const bookings =
      await bookingModel
        .find()
        .populate("userId")
        .populate("carId");

    res.json(bookings);
  }
);

// ================= APPROVE BOOKING =================
adminRouter.put(
  "/booking/approve/:bookingId",
  authMiddleware.authAdmin,
  async (req, res) => {
    try {
      const booking = await bookingModel
        .findById(req.params.bookingId)
        .populate("userId")
        .populate("carId");

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      booking.bookingStatus = "Approved";

      await booking.save();

      await BookingHistory.create({
        bookingId: booking._id,
        userId: booking.userId._id,
        carId: booking.carId._id,

        customerName: booking.userId.name,
        customerEmail: booking.userId.email,

        carName:
          booking.carId.brand +
          " " +
          booking.carId.model,

        totalAmount: booking.totalAmount,

        status: "Approved",

        actionDate: new Date(),
      });

      res.json({
        message: "Booking Approved Successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ================= REJECT BOOKING =================
adminRouter.put(
  "/booking/reject/:bookingId",
  authMiddleware.authAdmin,
  async (req, res) => {
    try {
      const booking = await bookingModel
        .findById(req.params.bookingId)
        .populate("userId")
        .populate("carId");

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      booking.bookingStatus = "Rejected";

      await booking.save();

      await CarModel.findByIdAndUpdate(
        booking.carId._id,
        {
          available: true,
        }
      );

      await BookingHistory.create({
        bookingId: booking._id,
        userId: booking.userId._id,
        carId: booking.carId._id,

        customerName: booking.userId.name,
        customerEmail: booking.userId.email,

        carName:
          booking.carId.brand +
          " " +
          booking.carId.model,

        totalAmount: booking.totalAmount,

        status: "Rejected",

        actionDate: new Date(),
      });

      res.json({
        message: "Booking Rejected Successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ================= DELETE BOOKING =================
adminRouter.delete(
  "/booking/:bookingId",
  authMiddleware.authAdmin,
  async (req, res) => {
    try {
      await bookingModel.findByIdAndDelete(
        req.params.bookingId
      );

      res.json({
        message:
          "Booking Deleted Successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ================= TOGGLE CAR STATUS =================
adminRouter.put(
  "/car/status/:carId",
  authMiddleware.authAdmin,
  async (req, res) => {
    try {
      const car =
        await CarModel.findById(
          req.params.carId
        );

      car.available =
        !car.available;

      await car.save();

      res.json({
        message:
          "Car status updated",
        available: car.available,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);


//Add history routes//
adminRouter.get(
  "/booking-history",
  authMiddleware.authAdmin,
  async (req, res) => {
    try {
      const history =
        await BookingHistory.find()
          .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

//Admin show the all booking details and update the booking status//
adminRouter.put(
    '/booking/update-status/:bookingId',
    authMiddleware.authAdmin,
    async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { bookingStatus } = req.body;

            const booking = await bookingModel.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            booking.bookingStatus = bookingStatus;
            await booking.save();

            res.json({
                message: "Booking status updated successfully",
                booking
            });
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

module.exports = adminRouter;   