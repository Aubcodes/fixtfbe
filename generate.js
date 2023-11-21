require("dotenv").config();

const jwt = require("jsonwebtoken");
const secret = process.env.ACCESS_SECRET_KEY; // Replace with your actual secret key
// Replace with your actual secret key

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, secret, { expiresIn: "1h" }); // You can adjust the expiration time as needed
  return token;
};

module.exports = { generateToken };
