const upload = require("../middleware/upload");
const { uploadFile } = require("../config/imagekit");

const CarModel = require("../module/car.model");

const express = require("express");
const carRouter = express.Router();

const authMiddleware = require("../middleware/AuthMiddleware");


// ======================== ADMIN CAN ADD CAR ========================

carRouter.post(
    "/add-cars",
    authMiddleware.authAdmin,
    upload.array("images", 5),
    async (req, res) => {

        try {

            const {
                model,
                brand,
                fuelType,
                transmission,
                seats,
                location,
                year,
                pricePerDay
            } = req.body;

            // Check images
            if (!req.files || req.files.length === 0) {

                return res.status(400).json({
                    message: "Images are required"
                });

            }

            // Upload multiple images
            const imageUrls = [];

            for (const file of req.files) {

                const imageUrl = await uploadFile(file);

                imageUrls.push(imageUrl);

            }

            // // console.log("BODY:", req.body);
            // // console.log("FILES:", req.files);

            // Create car
            const newCar = await CarModel.create({
                model,
                brand,
                fuelType,
                transmission,
                seats,
                location,
                year,
                pricePerDay,
                images: imageUrls
            });

            res.status(201).json({
                message: "Car added successfully",
                data: newCar
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Server error",
                error: error.message
            });

        }

    }
);


// ======================== ADMIN CAN DELETE CAR ========================

carRouter.delete(
    "/delete-car/:id",
    authMiddleware.authAdmin,
    async (req, res) => {

        try {

            const { id } = req.params;

            const deletedCar = await CarModel.findByIdAndDelete(id);

            if (!deletedCar) {

                return res.status(404).json({
                    message: "Car not found"
                });

            }

            res.status(200).json({
                message: "Car deleted successfully"
            });

        } catch (error) {

            res.status(500).json({
                message: "Server error",
                error: error.message
            });

        }

    }
);


// ======================== ADMIN CAN UPDATE CAR ========================

carRouter.put(
    "/update-car/:id",
    authMiddleware.authAdmin,
    upload.array("images", 5),
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                model,
                brand,
                fuelType,
                transmission,
                seats,
                location,
                year,
                pricePerDay,
                available
            } = req.body;

            // Find car
            const car = await CarModel.findById(id);

            if (!car) {

                return res.status(404).json({
                    message: "Car not found"
                });

            }

            // Keep old images by default
            let imageUrls = car.images;

            // Upload new images if provided
            if (req.files && req.files.length > 0) {

                imageUrls = [];

                for (const file of req.files) {

                    const imageUrl = await uploadFile(file);

                    imageUrls.push(imageUrl);

                }

            }

            // Update car
            const updatedCar = await CarModel.findByIdAndUpdate(
                id,
                {
                    model,
                    brand,
                    fuelType,
                    transmission,
                    seats,
                    location,
                    year,
                    pricePerDay,
                    available,
                    images: imageUrls
                },
                { new: true }
            );

            res.status(200).json({
                message: "Car updated successfully",
                data: updatedCar
            });

        } catch (error) {

            res.status(500).json({
                message: "Server error",
                error: error.message
            });

        }

    }
);

// ======================== GET ALL CARS ========================

carRouter.get("/", async (req, res) => {

    try {

        const cars = await CarModel.find();

        res.status(200).json({
            message: "Cars retrieved successfully",
            data: cars
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

});

module.exports = carRouter;