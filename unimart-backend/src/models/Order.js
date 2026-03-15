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
  

  // --- THE MISSION ---
  itemDetails: {
    canteenName: { type: String, required: true },
    items: [{ name: String, qty: Number, price: Number }],
    totalItemCost: { type: Number, required: true }
  },
  deliveryFee: {
    type: Number,
    required: true // The runner's cut
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
    default: 'PENDING'
  },
  deliveryPIN: {
    type: String,
    required: true // The randomly generated 4-digit code
  },

  // --- THE FINTECH ESCROW ---
  razorpayPaymentId: {
    type: String,
    default: null // The Razorpay transaction ID (Mandatory for automated refunds)
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