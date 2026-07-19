const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
{
    model:{
        type:String,
        required:true
    },

    brand:{
        type:String,
        required:true
    },

    fuelType:{
        type:String,
        required:true
    },

    transmission:{
        type:String,
        enum:["Manual","Automatic"],
        required:true
    },

    seats:{
        type:Number,
        required:true
    },

    location:{
        type:String,
        required:true
    },

    year:{
        type:Number,
        required:true
    },

    pricePerDay:{
        type:Number,
        required:true
    },

    images:[
        {
            type:String
        }
    ],

    available:{
        type:Boolean,
        default:true
    }

},
{
    timestamps:true,
    versionKey:false
}
);

const carModel = mongoose.model(
    "Car",
    carSchema
);

module.exports = carModel;