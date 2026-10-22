const jwt = require("jsonwebtoken");

async function authAdmin(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({
        message: "Authorization header is missing",
      });
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        message: "Token is missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied: admin only",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.log("ADMIN JWT ERROR:", error.name, error.message);

    return res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
}

async function authUser(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({
        message: "Authorization header is missing",
      });
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        message: "Token is missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "user") {
      return res.status(403).json({
        message: "Access denied: user only",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.log("USER JWT ERROR:", error.name, error.message);

    return res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
}

module.exports = { authAdmin, authUser };