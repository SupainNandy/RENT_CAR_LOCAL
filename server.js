require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/Database/db')

app.listen(8000,()=>{
    connectDb()
    console.log("Express server start at 8000");
})