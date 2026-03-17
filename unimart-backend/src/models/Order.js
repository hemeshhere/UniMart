const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // --- THE USERS ---
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  runnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null until a runner wins the atomic race condition
  },

  // --- THE MISSION(to be displayed on runner dashboard) ---
  itemDetails: {
    canteenName: { type: String, required: true },
    items: [{ name: String, qty: Number, price: Number }]
  },

  // --- THE ECONOMICS (Cleaned up) ---
  pricing: {
    canteenItemTotal: { type: Number, required: true }, // Cost of food
    deliveryFee: { type: Number, required: true },      // Runner's cut
    totalToPayAtDoor: { type: Number, required: true }  // Item Total + Delivery Fee
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  deliveryPIN: {
    type: String,
    required: true // The randomly generated 4-digit code
  },

  // --- THE GEOSPATIAL MAP DATA ---
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // format: [longitude, latitude]
  },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // format: [longitude, latitude]
  }
}, { timestamps: true });

// Create a 2dsphere index so MongoDB can quickly search for "Tasks near me"
orderSchema.index({ pickupLocation: '2dsphere' });
module.exports = mongoose.model('Order', orderSchema);