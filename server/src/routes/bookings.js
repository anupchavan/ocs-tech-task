const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, canBook, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper: detect time conflict for a room on a date (excluding a booking id)
async function hasConflict(roomId, date, startTime, endTime, excludeId = null) {
  const query = { room: roomId, date, status: 'confirmed' };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Booking.find(query).select('startTime endTime');
  return existing.some((b) => !(b.endTime <= startTime || b.startTime >= endTime));
}

// GET /api/bookings — list bookings
// Admin: all bookings; others: own bookings only
// Query params: date, status, roomId, upcoming (true/false)
router.get('/', protect, async (req, res) => {
  try {
    const { date, status, roomId, upcoming } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') filter.bookedBy = req.user._id;
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (roomId) filter.room = roomId;
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      filter.date = { $gte: today };
      filter.status = 'confirmed';
    }

    const bookings = await Booking.find(filter)
      .populate('room', 'block roomName capacity')
      .populate('bookedBy', 'name email role')
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/stats — admin dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [total, upcoming, todayCount, cancelled] = await Promise.all([
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'confirmed', date: { $gte: today } }),
      Booking.countDocuments({ date: today, status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ]);
    const purposeStats = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
    ]);
    res.json({ total, upcoming, todayCount, cancelled, purposeStats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'block roomName capacity')
      .populate('bookedBy', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Non-admins can only see own bookings
    if (req.user.role !== 'admin' && booking.bookedBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings — create booking
router.post('/', protect, canBook, async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, purpose, participants, notes } = req.body;

    if (!roomId || !date || !startTime || !endTime || !purpose || !participants)
      return res.status(400).json({ message: 'All fields are required' });

    if (endTime <= startTime)
      return res.status(400).json({ message: 'End time must be after start time' });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!room.isAvailable) return res.status(400).json({ message: 'Room is not available for booking' });

    // Capacity check
    if (participants > room.capacity)
      return res.status(400).json({
        message: `Room capacity (${room.capacity}) is less than expected participants (${participants})`,
      });

    // Purpose check
    if (room.allowedPurposes.length > 0 && !room.allowedPurposes.includes(purpose))
      return res.status(400).json({ message: `This room does not allow ${purpose} bookings` });

    // Conflict check
    if (await hasConflict(roomId, date, startTime, endTime))
      return res.status(409).json({ message: 'Room is already booked for this time slot' });

    // Past date check
    const today = new Date().toISOString().split('T')[0];
    if (date < today)
      return res.status(400).json({ message: 'Cannot book a room for a past date' });

    const booking = await Booking.create({
      room: roomId,
      bookedBy: req.user._id,
      date,
      startTime,
      endTime,
      purpose,
      participants,
      notes,
    });

    const populated = await booking.populate([
      { path: 'room', select: 'block roomName capacity' },
      { path: 'bookedBy', select: 'name email' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/bookings/:id — update booking (admin: any; user: own confirmed only)
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.bookedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Cannot modify a cancelled booking' });

    const { date, startTime, endTime, purpose, participants, notes } = req.body;

    const newDate = date || booking.date;
    const newStart = startTime || booking.startTime;
    const newEnd = endTime || booking.endTime;
    const newParticipants = participants || booking.participants;

    if (newEnd <= newStart) return res.status(400).json({ message: 'End time must be after start time' });

    const room = await Room.findById(booking.room);
    if (newParticipants > room.capacity)
      return res.status(400).json({ message: `Exceeds room capacity (${room.capacity})` });

    if (await hasConflict(booking.room, newDate, newStart, newEnd, booking._id))
      return res.status(409).json({ message: 'Room is already booked for this time slot' });

    if (date) booking.date = date;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (purpose) booking.purpose = purpose;
    if (participants) booking.participants = participants;
    if (notes !== undefined) booking.notes = notes;

    await booking.save();
    const populated = await booking.populate([
      { path: 'room', select: 'block roomName capacity' },
      { path: 'bookedBy', select: 'name email' },
    ]);
    res.json(populated);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/bookings/:id — cancel booking
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.bookedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking already cancelled' });

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
