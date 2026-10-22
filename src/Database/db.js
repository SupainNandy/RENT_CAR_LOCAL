const mongoose = require('mongoose')

async function connectDb() {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connection successfuly..");
        

    }catch(err){
        console.error("MongoDB connection failed");
        
        
    }
}

module.exports = connectDb