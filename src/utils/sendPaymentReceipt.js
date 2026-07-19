const nodemailer = require("nodemailer");

const sendPaymentReceipt = async ({
  userEmail,
  userName,
  booking,
  paymentId,
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const carName = `${booking.carId?.brand || ""} ${
    booking.carId?.model || ""
  }`;

  await transporter.sendMail({
    from: `"Royal Route" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Payment Successful — Royal Route Booking Receipt",

    html: `
      <div style="background-color: #050505; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; background: #111111; border: 1px solid #d4af37; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Logo & Header -->
          <div style="background: linear-gradient(135deg, #161616, #0a0a0a); padding: 35px 30px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.2);">
            <div style="font-size: 32px; font-weight: bold; color: #D4AF37; letter-spacing: 2px; text-transform: uppercase;">
              ROYAL ROUTE
            </div>
            <div style="font-size: 11px; color: #ffffff; letter-spacing: 3px; text-transform: uppercase; margin-top: 5px; opacity: 0.7;">
              Luxury Car Rental
            </div>
          </div>
          
          <!-- Body Content -->
          <div style="padding: 40px 30px; color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; color: #4CAF50; font-size: 28px; font-weight: bold; margin-bottom: 15px; text-align: center;">
                ✓
              </div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">Payment Confirmed</h2>
              <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">Your reservation is now fully secured.</p>
            </div>

            <p style="font-size: 15px; color: #ddd; line-height: 1.6; margin-bottom: 25px;">
              Hello <strong style="color: #ffffff;">${userName}</strong>,
            </p>
            <p style="font-size: 15px; color: #ddd; line-height: 1.6; margin-bottom: 30px;">
              Thank you for booking with Royal Route. We have successfully processed your payment. Below is your booking summary and digital receipt.
            </p>

            <!-- Booking Card -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 13px; font-weight: bold; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px;">
                Reservation Summary
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 10px 0; color: #888; width: 40%; border-bottom: 1px solid rgba(255,255,255,0.05);">Car Selected</td>
                  <td style="padding: 10px 0; color: #ffffff; font-weight: bold; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${carName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #888; border-bottom: 1px solid rgba(255,255,255,0.05);">Booking Reference</td>
                  <td style="padding: 10px 0; color: #ffffff; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${booking._id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #888; border-bottom: 1px solid rgba(255,255,255,0.05);">Pickup Date</td>
                  <td style="padding: 10px 0; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${new Date(booking.pickupDate).toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #888;">Return Date</td>
                  <td style="padding: 10px 0; color: #ffffff; text-align: right;">${new Date(booking.returnDate).toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
              </table>
            </div>

            <!-- Financial Breakdown -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 13px; font-weight: bold; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px;">
                Receipt Details
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0; color: #888; border-bottom: 1px solid rgba(255,255,255,0.05);">Transaction ID</td>
                  <td style="padding: 10px 0; color: #ffffff; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #888; border-bottom: 1px solid rgba(255,255,255,0.05);">Base Rental Fare</td>
                  <td style="padding: 10px 0; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">₹${Math.round(booking.totalAmount * 0.85).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #888;">Service Tax & GST (18%)</td>
                  <td style="padding: 10px 0; color: #ffffff; text-align: right;">₹${Math.round(booking.totalAmount - Math.round(booking.totalAmount * 0.85)).toLocaleString("en-IN")}</td>
                </tr>
              </table>
              
              <div style="background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 18px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; font-weight: bold; color: #ffffff;">Total Paid</span>
                <span style="font-size: 24px; font-weight: bold; color: #D4AF37; text-align: right; display: block; width: 100%;">₹${booking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <a href="http://localhost:3000/user/mybookings" style="background-color: #D4AF37; color: #000000; padding: 14px 30px; border-radius: 10px; font-size: 15px; font-weight: bold; text-decoration: none; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                Manage Your Bookings
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #0d0d0d; padding: 25px 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #555;">
            <p style="margin: 0 0 8px 0; color: #888;">🔒 Safe & Secure Digital Receipt</p>
            <p style="margin: 0; color: #555;">&copy; ${new Date().getFullYear()} Royal Route. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  });
};

module.exports = sendPaymentReceipt;