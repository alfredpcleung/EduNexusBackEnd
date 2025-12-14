const mongoose = require('mongoose');
const User = require('./app/Models/user');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.ATLAS_DB);
  const users = await User.find({}, { uid: 1, email: 1, _id: 0 });
  console.log('All users:', users);
  process.exit();
})();