const express = require('express');

const bookingRouter = express.Router();

const bookingModel = require('../module/booking.model');

const CarModel = require('../module/car.model');

const authMiddleware = require('../middleware/AuthMiddleware');


// ================= USER BOOKING =================

bookingRouter.post(
    '/book/:carId',
    authMiddleware.authUser,
    async (req, res) => {

        try {

            const { carId } = req.params;

            const {
                pickupDate,
                returnDate
            } = req.body;

            // Find car
            const car = await CarModel.findById(carId);

            if (!car) {

                return res.status(404).json({
                    message: "Car not found"
                });

            }

            // Check availability
            if (!car.available) {

                return res.status(400).json({
                    message: "Car is not available"
                });

            }

            // Calculate total days
            const start = new Date(pickupDate);

            const end = new Date(returnDate);

            const timeDiff =
                end.getTime() - start.getTime();

            const days =
                Math.ceil(
                    timeDiff / (1000 * 3600 * 24)
                );

            // Calculate total amount
            const totalAmount =
                days * car.pricePerDay;

            // Create booking
            const booking =
                await bookingModel.create({

                    userId: req.user.id,

                    carId: carId,

                    pickupDate,

                    returnDate,

                    totalAmount

                });

            // Optional:
            // Make car unavailable

            car.available = false;

            await car.save();

            res.status(201).json({

                message: "Booking created successfully",

                booking

            });

        } catch (error) {

            res.status(500).json({

                message: "Server error",

                error: error.message

            });

        }

    }
);



//Admin delete booking
bookingRouter.delete(
    '/delete/:bookingId',
    authMiddleware.authAdmin,
    async (req, res) => {

        try {

            const { bookingId } = req.params;

            // Find booking first
            const booking =
                await bookingModel.findById(bookingId);

            if (!booking) {

                return res.status(404).json({
                    message: "Booking not found"
                });

            }

            // Make car available again
            await CarModel.findByIdAndUpdate(
                booking.carId,
                {
                    available: true
                }
            );

            // Delete booking
            await bookingModel.findByIdAndDelete(
                bookingId
            );

            res.status(200).json({
                message: "Booking deleted successfully"
            });

        } catch (error) {

            res.status(500).json({
                message: "Server error",
                error: error.message
            });

        }

    }
);

//===================Admin can update booking Status====================

bookingRouter.put(
    '/update-status/:bookingId',
    authMiddleware.authAdmin,
    async (req, res) => {
        try {

            const { bookingId } = req.params;
            const { bookingStatus } = req.body;

            const booking = await bookingModel.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    message: "Booking not found"
                });
            }
            booking.bookingStatus = bookingStatus;
            await booking.save();
            res.status(200).json({
                message: "Booking status updated successfully",
                booking
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);


//Get User's Own Bookings
bookingRouter.get(
  "/my-bookings",
  authMiddleware.authUser,
  async (req, res) => {
    try {
      const bookings = await bookingModel
        .find({
          userId: req.user.id,
        })
        .populate("carId");

      res.status(200).json({
        bookings,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

//User cancel booking
bookingRouter.put(
  "/cancel/:bookingId",
  authMiddleware.authUser,
  async (req, res) => {
    try {
      const { bookingId } = req.params;

      // Validate ObjectId
      if (!bookingId || !bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const booking = await bookingModel.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      booking.bookingStatus = "Cancelled";
      await booking.save();

      // Use booking.carId directly (not booking.carId._id)
      await CarModel.findByIdAndUpdate(booking.carId, { available: true });

      res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);


//User update booking dates
bookingRouter.put(
  "/update/:bookingId",
  authMiddleware.authUser,
  async (req, res) => {
    try {
      const { bookingId } =
        req.params;

      const {
        pickupDate,
        returnDate,
      } = req.body;

      const booking =
        await bookingModel
          .findById(bookingId)
          .populate("carId");

      if (!booking) {
        return res.status(404).json({
          message:
            "Booking not found",
        });
      }

      if (
        booking.userId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      const start = new Date(
        pickupDate
      );

      const end = new Date(
        returnDate
      );

      const days = Math.ceil(
        (end - start) /
          (1000 * 3600 * 24)
      );

      booking.pickupDate =
        pickupDate;

      booking.returnDate =
        returnDate;

      booking.totalAmount =
        days *
        booking.carId.pricePerDay;

      await booking.save();

      res.status(200).json({
        message:
          "Booking updated successfully",
        booking,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);


// User delete booking
bookingRouter.delete(
  "/delete/:bookingId",
  authMiddleware.authUser,
  async (req, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await bookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Ensure user owns the booking
      if (booking.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Make car available again
      await CarModel.findByIdAndUpdate(booking.carId, { available: true });

      // Delete booking
      await bookingModel.findByIdAndDelete(bookingId);

      res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

//Admin have all booking details
bookingRouter.get(
  "/all",
    authMiddleware.authAdmin,
    async (req, res) => {
    try {
        const bookings = await bookingModel.find().populate("userId").populate("carId");

        res.status(200).json({
            bookings
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}
);
module.exports = bookingRouter;