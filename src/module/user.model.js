const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        default:null
    },

    provider:{
        type:String,
        enum:["local","google"],
        default:"local"
    },

    role:{
        type:String,
        required:true,
        default:"user"
    }
},
{
    timestamps:true,
    versionKey:false
}
);

const usermodel = mongoose.model(
    "User",
    userSchema
);

module.exports = usermodel;