const Razorpay = require("razorpay");

let razorpay;
let razorpayCredentials;

const getRazorpayCredentials = () => {
  if (razorpayCredentials) {
    return razorpayCredentials;
  }

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay environment variables are required");
  }

  razorpayCredentials = {
    keyId: RAZORPAY_KEY_ID,
    keySecret: RAZORPAY_KEY_SECRET,
  };

  return razorpayCredentials;
};

const getRazorpay = () => {
  if (!razorpay) {
    const { keyId, keySecret } = getRazorpayCredentials();
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return razorpay;
};

const getRazorpayKeySecret = () => getRazorpayCredentials().keySecret;

module.exports = { getRazorpay, getRazorpayKeySecret };