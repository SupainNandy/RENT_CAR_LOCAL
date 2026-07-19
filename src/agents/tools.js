const bookingModel =
    require("../module/booking.model");

const carModel =
    require("../module/car.model");

const getTodayBookings = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return bookingModel.countDocuments({
        createdAt: {
            $gte: start,
            $lte: end
        }
    });
};

const getPendingBookings = async () => {
    return bookingModel.countDocuments({
        bookingStatus: "Pending"
    });
};

const totalRevenue = async () => {
    const bookings =
        await bookingModel.find();

    return bookings.reduce(
        (sum, booking) =>
            sum + booking.totalAmount,
        0
    );
};

const getAvailableCars = async () => {
    return carModel.countDocuments({
        available: true
    });
};

const getTotalCars = async () => {
    return carModel.countDocuments();
};

const getRejectedBookings =
    async () => {
        return bookingModel.countDocuments({
            bookingStatus: "Rejected"
        });
    };

const getMostBookedCars = async () => {
    const result =
        await bookingModel.aggregate([
            {
                $group: {
                    _id: "$carId",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $limit: 1
            }
        ]);

    if (!result.length) {
        return "No bookings found";
    }

    const car =
        await carModel.findById(
            result[0]._id
        );

    if (!car) {
        return "Car not found";
    }

    return `${car.brand} ${car.model}`;
};

const getApprovedBookings = async () => {
    return bookingModel.countDocuments({
        bookingStatus: "Approved"
    });
};

const getCancelledBookings = async () => {
    return bookingModel.countDocuments({
        bookingStatus: "Cancelled"
    });
};

const getBookedCars = async () => {
    return carModel.countDocuments({
        available: false
    });
};

const getRevenueToday = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const bookings = await bookingModel.find({
        createdAt: {
            $gte: start,
            $lte: end
        }
    });

    return bookings.reduce(
        (sum, booking) => sum + booking.totalAmount,
        0
    );
};

const getAverageBookingValue = async () => {
    const bookings = await bookingModel.find();

    if (!bookings.length) return 0;

    const revenue = bookings.reduce(
        (sum, booking) => sum + booking.totalAmount,
        0
    );

    return Math.round(revenue / bookings.length);
};

const getHighestRevenueCar = async () => {
  const result = await bookingModel.aggregate([
    {
      $group: {
        _id: "$carId",
        revenue: {
          $sum: "$totalAmount"
        }
      }
    },
    {
      $sort: {
        revenue: -1
      }
    },
    {
      $limit: 1
    }
  ]);

  if (!result.length) {
    return "No data";
  }

  const car = await carModel.findById(
    result[0]._id
  );

  return {
    car: `${car.brand} ${car.model}`,
    revenue: result[0].revenue
  };
};
 
const getLatestBooking = async () => {
  const booking =
    await bookingModel
      .findOne()
      .populate("userId")
      .populate("carId")
      .sort({ createdAt: -1 });

  if (!booking) {
    return "No booking found";
  }

  return {
    customer: booking.userId?.name,
    car: `${booking.carId?.brand} ${booking.carId?.model}`,
    amount: booking.totalAmount
  };
};

const getMonthlyRevenue = async () => {
  const start = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const bookings = await bookingModel.find({
    createdAt: {
      $gte: start
    }
  });

  return bookings.reduce(
    (sum, booking) => sum + booking.totalAmount,
    0
  );
};

const getFleetUtilization = async () => {
  const totalCars =
    await carModel.countDocuments();

  const bookedCars =
    await carModel.countDocuments({
      available: false
    });

  if (!totalCars) return 0;

  return (
    (
      bookedCars / totalCars
    ) * 100
  ).toFixed(2);
};
 
const getBusinessInsights = async () => {
  const totalCars =
    await carModel.countDocuments();

  const availableCars =
    await carModel.countDocuments({
      available: true
    });

  const totalBookings =
    await bookingModel.countDocuments();

  const revenue =
    await totalRevenue();

  return {
    totalCars,
    availableCars,
    totalBookings,
    revenue
  };
};

module.exports = {
  getTodayBookings,
  getPendingBookings,
  totalRevenue,
  getAvailableCars,
  getTotalCars,
  getRejectedBookings,
  getMostBookedCars,
  getApprovedBookings,
  getCancelledBookings,
  getBookedCars,
  getRevenueToday,
  getAverageBookingValue,
  getHighestRevenueCar,
  getLatestBooking,
  getMonthlyRevenue,
  getFleetUtilization,
  getBusinessInsights
};