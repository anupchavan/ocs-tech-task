const mongoose = require('mongoose');

const VALID_PURPOSES = ['OA', 'Interview', 'PPT'];
const VALID_BLOCKS = ['A', 'B', 'C', 'CSE', 'LHC', 'BT/BM', 'CY', 'EE', 'MA', 'MSME', 'PH', 'Other'];

const roomSchema = new mongoose.Schema({
  block: { type: String, required: true, trim: true },
  roomName: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  isAvailable: { type: Boolean, default: true },
  // empty array = all purposes allowed
  allowedPurposes: {
    type: [{ type: String, enum: VALID_PURPOSES }],
    default: [],
  },
  notes: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index: block + roomName
roomSchema.index({ block: 1, roomName: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
module.exports.VALID_PURPOSES = VALID_PURPOSES;
module.exports.VALID_BLOCKS = VALID_BLOCKS;
