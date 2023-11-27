const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  merchantId: {
    type: String,
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  amountDeposited: {
    type: Number,
    default: 0,
  },
  username: {
    type: String,
    required: true,
  },
  passPhrase: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", userSchema);

const photoSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Add any other fields you may need for your photo model
});

const Photo = mongoose.model("Photo", photoSchema);

module.exports = { User, Photo };
