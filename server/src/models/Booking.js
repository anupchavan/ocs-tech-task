const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },       // "YYYY-MM-DD"
  startTime: { type: String, required: true },  // "HH:MM"
  endTime: { type: String, required: true },    // "HH:MM"
  purpose: { type: String, enum: ['OA', 'Interview', 'PPT'], required: true },
  participants: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  notes: { type: String, trim: true, default: '' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cancelledAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Index for conflict checks
bookingSchema.index({ room: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
