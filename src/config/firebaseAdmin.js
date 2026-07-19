const { initializeApp, cert } = require("firebase-admin/app");

const serviceAccount = require("../carrental-2897c-firebase-adminsdk-fbsvc-6adb887b60.json");

initializeApp({
  credential: cert(serviceAccount),
});