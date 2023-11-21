require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.MY_CLOUDINARY_NAME,
  api_key: process.env.MY_CLOUDINARY_API_KEY,
  api_secret: process.env.MY_CLOUDINARY_API_SECRET,
});

const options = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
};

module.exports = (image) => {
  return new Promise((resolve, reject) => {
    const uploadCallback = (err, result) => {
      if (result && result.secure_url) {
        return resolve(result.secure_url);
      }
      return reject({ error: err.message });
    };

    if (Buffer.isBuffer(image)) {
      // If 'image' is a buffer, upload it directly
      cloudinary.uploader.upload_stream(options, uploadCallback).end(image);
    } else if (typeof image === "string") {
      // If 'image' is a string (file path), upload it
      cloudinary.uploader.upload(image, options, uploadCallback);
    } else {
      reject({ error: "Invalid image type" });
    }
  });
};
