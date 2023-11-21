// authMiddleware.js
require("dotenv").config();

const jwt = require("jsonwebtoken");

const secret = process.env.ACCESS_SECRET_KEY; // Replace with your actual secret key

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const tokenParts = token.split(" ");

  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid token format" });
  }

  const actualToken = tokenParts[1];

  jwt.verify(actualToken, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
