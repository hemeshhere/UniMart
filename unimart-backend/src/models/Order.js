const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  runnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  itemDetails: {
    canteenName: { type: String, required: true },
    items: [{ name: String, qty: Number, price: Number }],
    totalItemCost: { type: Number, required: true }
  },
  deliveryFee: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
    default: 'PENDING'
  },
  deliveryPIN: { type: String, required: true },
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } 
  },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } 
  }
}, { timestamps: true });

orderSchema.index({ pickupLocation: '2dsphere' });
module.exports = mongoose.model('Order', orderSchema);