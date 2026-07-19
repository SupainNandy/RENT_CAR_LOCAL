const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors({
    origin:"*"
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.send("hello world")
})

//Admin
const adminRouter = require('../src/routes/admin.routes')
app.use('/admin',adminRouter)

//Car
const carRouter = require('../src/routes/car.routes')
app.use('/cars',carRouter)

//user
const userRouter = require('../src/routes/user.routes')
app.use('/users',userRouter)

//booking
const bookingRouter = require('../src/routes/booking.routes')
app.use('/bookings',bookingRouter)


//agent
const agentRouter = require('../src/routes/agent.routes')
app.use('/agent',agentRouter)

//payment
const paymentRouter = require('../src/routes/payment.route')
app.use('/payment',paymentRouter)

module.exports = app