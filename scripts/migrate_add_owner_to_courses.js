// Migration script to add `owner` field to all courses if missing
// Usage: node scripts/migrate_add_owner_to_courses.js

const mongoose = require('mongoose');
const Course = require('../app/Models/course');
const User = require('../app/Models/user');

const MONGO_URI = process.env.ATLAS_DB || 'mongodb://localhost:27017/ednexus';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Find all courses missing the owner field
  const courses = await Course.find({ $or: [ { owner: { $exists: false } }, { owner: null } ] });
  console.log(`Found ${courses.length} course(s) missing owner field.`);

  let defaultUser = await User.findOne();
  if (!defaultUser) {
    // Create a dummy user if none exists
    defaultUser = await User.create({
      firstName: 'Default',
      lastName: 'Owner',
      email: `default_owner_${Date.now()}@example.com`,
      password: 'TempPassword123',
      role: 'admin',
      school: 'Default School',
      fieldOfStudy: 'Default Field'
    });
    console.log('Created default owner user:', defaultUser._id);
  }

  for (const course of courses) {
    // Prefer createdBy if present, else use default user
    course.owner = course.createdBy || defaultUser._id;
    await course.save();
    console.log(`Updated course ${course._id} with owner ${course.owner}`);
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
