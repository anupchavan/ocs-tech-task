const express = require('express');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms — list rooms (all authenticated users, with optional filters)
router.get('/', protect, async (req, res) => {
  try {
    const { block, minCapacity, purpose, date, startTime, endTime } = req.query;
    const filter = {};
    if (block) filter.block = block;
    if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };
    if (purpose && purpose !== 'all') {
      // rooms where allowedPurposes is empty (all allowed) OR includes the purpose
      filter.$or = [{ allowedPurposes: { $size: 0 } }, { allowedPurposes: purpose }];
    }

    let rooms = await Room.find(filter).sort({ block: 1, roomName: 1 });

    // If date + time range given, filter out rooms with conflicting bookings
    if (date && startTime && endTime) {
      const confirmed = await Booking.find({
        date,
        status: 'confirmed',
        room: { $in: rooms.map((r) => r._id) },
      }).select('room startTime endTime');

      const conflictingRoomIds = new Set();
      for (const b of confirmed) {
        // Overlap: NOT (b.endTime <= startTime OR b.startTime >= endTime)
        if (!(b.endTime <= startTime || b.startTime >= endTime)) {
          conflictingRoomIds.add(b.room.toString());
        }
      }
      rooms = rooms.filter((r) => !conflictingRoomIds.has(r._id.toString()));
    }

    res.json(rooms);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/blocks — list distinct blocks
router.get('/blocks', protect, async (req, res) => {
  try {
    const blocks = await Room.distinct('block');
    res.json(blocks.sort());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/:id — get single room
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms — admin creates room
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { block, roomName, capacity, isAvailable, allowedPurposes, notes } = req.body;
    if (!block || !roomName || !capacity)
      return res.status(400).json({ message: 'Block, room name, and capacity are required' });

    const room = await Room.create({ block, roomName, capacity, isAvailable, allowedPurposes, notes });
    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Room already exists in this block' });
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rooms/:id — admin updates room
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const { block, roomName, capacity, isAvailable, allowedPurposes, notes } = req.body;
    if (block !== undefined) room.block = block;
    if (roomName !== undefined) room.roomName = roomName;
    if (capacity !== undefined) room.capacity = capacity;
    if (isAvailable !== undefined) room.isAvailable = isAvailable;
    if (allowedPurposes !== undefined) room.allowedPurposes = allowedPurposes;
    if (notes !== undefined) room.notes = notes;

    await room.save();
    res.json(room);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Room name already exists in this block' });
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id — admin deletes room
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
