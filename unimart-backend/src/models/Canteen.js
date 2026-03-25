const mongoose = require('mongoose');

// Sub-schema for individual food items
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true } // Toggle this to false when they run out
});

// Sub-schema to group items (e.g., "Snacks", "Beverages")
const menuCategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  items: [menuItemSchema]
});

// Main Canteen Schema
const canteenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true }, // e.g., "Block 41"
  packingFee: { type: Number, default: 0, min: 0 },
  isOpen: { type: Boolean, default: true }, // Master toggle to close the whole canteen at night
  imageUrl: { type: String, default: null }, // Host images on Cloudinary, save the URL here
  menu: [menuCategorySchema]
}, { timestamps: true });
canteenSchema.index({ name: 1 });
module.exports = mongoose.model('Canteen', canteenSchema);
