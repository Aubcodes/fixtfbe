require("dotenv").config();

const PORT = 4005;

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const router = require("./routes");
const fileUpload = require("express-fileupload");
const { User, Photo, Admin } = require("./model");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(fileUpload());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.uri)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/v1", router);

app.listen(PORT, console.log(`PORT ${PORT}`));
