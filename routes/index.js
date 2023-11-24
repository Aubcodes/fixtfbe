const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, Photo } = require("../model"); // Assuming you have a User model
const uploadImage = require("../upload.image");
const authMiddleware = require("../authMiddleware");
const { generateToken } = require("../generate");

router.post("/login", async (req, res) => {
  const { email, passPhrase } = req.body;

  // Check if the required fields are provided
  if (!email || !passPhrase) {
    return res.status(400).json({ error: "Email and passPhrase are required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const photo = await Photo.findOne({ user: user._id });

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(passPhrase, user.passPhrase);

    // Check if the password is valid
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      email: user.email,
      username: user.username,
      imageUrl: photo.imageUrl,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/signup", async (req, res) => {
  const { email, username, passPhrase } = req.body;

  // Check if the required fields are provided
  if (!email || !username || !passPhrase) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(passPhrase, 10);

    // Create a new user
    const newUser = new User({
      email,
      username,
      passPhrase: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    // Create a new photo entry for the user
    const imageUrl = ""; // Set your default image URL here
    const newPhoto = new Photo({
      imageUrl,
      user: newUser._id,
    });
    await newPhoto.save();

    const token = generateToken(newUser._id);

    // Return the newly created user along with imageUrl
    res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
      username: newUser.username,
      imageUrl,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/upload", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const image = req.files.image;
    const imageUrl = await uploadImage(image.data);

    // Find the user's existing photo
    const existingPhoto = await Photo.findOne({ user: userId });

    if (!existingPhoto) {
      // If no existing photo, create a new one
      const newPhoto = new Photo({
        imageUrl,
        user: userId,
      });
      await newPhoto.save();
    } else {
      // If existing photo, update its imageUrl
      existingPhoto.imageUrl = imageUrl;
      await existingPhoto.save();
    }

    res.status(200).json({
      message: "Uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error uploading photos: " + error);
  }
});

module.exports = router;
