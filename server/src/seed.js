/**
 * Seed script — run once to populate rooms and create the default admin.
 * Usage: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ocs_room_booking';

const rooms = [
  // A Block
  { block: 'A', roomName: 'A-Class Room 320', capacity: 80 },
  { block: 'A', roomName: 'A-AUDITORIUM',     capacity: 289 },
  { block: 'A', roomName: 'A-Class Room 111', capacity: 70 },
  { block: 'A', roomName: 'A-Class Room 112', capacity: 80 },
  { block: 'A', roomName: 'A-Class Room 114', capacity: 36 },
  { block: 'A', roomName: 'A-Class Room 117', capacity: 84 },
  { block: 'A', roomName: 'A-Class Room 118', capacity: 84 },
  { block: 'A', roomName: 'A-Class Room 119', capacity: 108 },
  { block: 'A', roomName: 'A-Class Room 220', capacity: 40 },
  { block: 'A', roomName: 'A-Class Room 221', capacity: 120 },
  { block: 'A', roomName: 'A-LH-1',           capacity: 184 },
  { block: 'A', roomName: 'A-LH-2',           capacity: 184 },
  // BT/BM Block
  { block: 'BT/BM', roomName: 'BT/BM-009', capacity: 24 },
  { block: 'BT/BM', roomName: 'BT/BM-010', capacity: 24 },
  { block: 'BT/BM', roomName: 'BT/BM-118', capacity: 60 },
  // C Block
  { block: 'C', roomName: 'C-LH-10', capacity: 68 },
  { block: 'C', roomName: 'C-LH-2',  capacity: 138 },
  { block: 'C', roomName: 'C-LH-3',  capacity: 100 },
  { block: 'C', roomName: 'C-LH-4',  capacity: 60 },
  { block: 'C', roomName: 'C-LH-5',  capacity: 60 },
  { block: 'C', roomName: 'C-LH-6',  capacity: 60 },
  { block: 'C', roomName: 'C-LH-7',  capacity: 70 },
  { block: 'C', roomName: 'C-LH-9',  capacity: 66 },
  // CSE Block
  { block: 'CSE', roomName: 'CSE-LH-01', capacity: 70 },
  { block: 'CSE', roomName: 'CSE-LH-02', capacity: 70 },
  { block: 'CSE', roomName: 'CSE-LH-03', capacity: 70 },
  // CY Block
  { block: 'CY', roomName: 'CY-LH-1', capacity: 30 },
  { block: 'CY', roomName: 'CY-LH-2', capacity: 40 },
  { block: 'CY', roomName: 'CY-LH-3', capacity: 90 },
  // EE Block
  { block: 'EE', roomName: 'EE-004(GF)', capacity: 80 },
  { block: 'EE', roomName: 'EE-20 (SF)', capacity: 60 },
  // LHC Block
  { block: 'LHC', roomName: 'LHC-01', capacity: 72 },
  { block: 'LHC', roomName: 'LHC-02', capacity: 72 },
  { block: 'LHC', roomName: 'LHC-03', capacity: 120 },
  { block: 'LHC', roomName: 'LHC-04', capacity: 200 },
  { block: 'LHC', roomName: 'LHC-05', capacity: 800 },
  { block: 'LHC', roomName: 'LHC-06', capacity: 320 },
  { block: 'LHC', roomName: 'LHC-07', capacity: 200 },
  { block: 'LHC', roomName: 'LHC-08', capacity: 120 },
  { block: 'LHC', roomName: 'LHC-09', capacity: 72 },
  { block: 'LHC', roomName: 'LHC-10', capacity: 72 },
  { block: 'LHC', roomName: 'LHC-11', capacity: 120 },
  { block: 'LHC', roomName: 'LHC-12', capacity: 200 },
  { block: 'LHC', roomName: 'LHC-13', capacity: 320 },
  { block: 'LHC', roomName: 'LHC-14', capacity: 200 },
  { block: 'LHC', roomName: 'LHC-15', capacity: 120 },
  // MA Block
  { block: 'MA', roomName: 'MA-01',  capacity: 56 },
  { block: 'MA', roomName: 'MA-02',  capacity: 56 },
  { block: 'MA', roomName: 'MA-114', capacity: 30 },
  // MSME Block
  { block: 'MSME', roomName: 'MSME-LH-1', capacity: 36 },
  { block: 'MSME', roomName: 'MSME-LH-2', capacity: 60 },
  { block: 'MSME', roomName: 'MSME-LH-3', capacity: 106 },
  // PH Block
  { block: 'PH', roomName: 'PH-1', capacity: 80 },
  { block: 'PH', roomName: 'PH-2', capacity: 60 },
  { block: 'PH', roomName: 'PH-3', capacity: 50 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Create admin user if none exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'OCS Admin',
      email: 'admin@ocs.iith.ac.in',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin created — email: admin@ocs.iith.ac.in  password: admin123');
  } else {
    console.log('ℹ️  Admin already exists, skipping');
  }

  // Seed rooms
  let created = 0;
  let skipped = 0;
  for (const r of rooms) {
    try {
      await Room.create(r);
      created++;
    } catch (err) {
      if (err.code === 11000) skipped++;
      else console.error('Room error:', r.roomName, err.message);
    }
  }
  console.log(`✅ Rooms seeded — ${created} created, ${skipped} already existed`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
