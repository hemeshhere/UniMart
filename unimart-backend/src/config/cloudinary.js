const cloudinary = require('cloudinary').v2;

cloudinary.config({
  // Automatically pulls from CLOUDINARY_URL in .env
});
module.exports = cloudinary;