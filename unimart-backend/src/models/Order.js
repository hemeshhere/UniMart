const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  runnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null until someone wins the race condition
  },
  itemDetails: {
    canteenName: { type: String, required: true },
    items: [{ name: String, qty: Number, price: Number }],
    totalItemCost: { type: Number, required: true }
  },
  deliveryFee: {
    type: Number,
    required: true // e.g., ₹15
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
    default: 'PENDING'
  },
  deliveryPIN: {
    type: String,
    required: true // The 4-digit code generated upon creation
  },
  // GeoJSON for mapping and distance calculations
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
}, { timestamps: true });

// Create a 2dsphere index so MongoDB can quickly search by distance
orderSchema.index({ pickupLocation: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);