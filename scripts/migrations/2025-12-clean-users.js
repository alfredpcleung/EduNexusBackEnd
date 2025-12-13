require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../app/Models/user');

(async function cleanUsers() {
  try {
    console.log('Starting user cleanup migration...');

    // Connect to the database using ATLAS_DB from .env
    await mongoose.connect(process.env.ATLAS_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Define necessary fields for each role
    const necessaryFields = {
      admin: ['uid', 'email', 'role', 'firstName', 'lastName', 'created', 'updated', 'password'],
      student: ['uid', 'email', 'role', 'firstName', 'lastName', 'schoolName', 'programName', 'created', 'updated', 'password']
    };

    // Helper function to recursively remove null, empty, or unnecessary fields
    const cleanDocument = (doc, allowedFields) => {
      Object.keys(doc).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete doc[key]; // Remove fields not in the allowed list
        } else if (doc[key] === null || doc[key] === '' || (Array.isArray(doc[key]) && doc[key].length === 0)) {
          delete doc[key]; // Remove null, empty, or empty arrays
        } else if (typeof doc[key] === 'object' && !Array.isArray(doc[key])) {
          cleanDocument(doc[key], allowedFields); // Recursively clean nested objects
        }
      });
    };

    // Fetch all users
    const users = await User.find();

    for (const user of users) {
      try {
        const role = user.role;
        const allowedFields = necessaryFields[role] || [];

        // Convert the user document to a plain object for cleaning
        const userObject = user.toObject();

        // Clean the document
        cleanDocument(userObject, allowedFields);

        // Ensure necessary fields are not empty
        if (role === 'student') {
          userObject.schoolName = userObject.schoolName || 'Unknown School';
          userObject.programName = userObject.programName || 'Unknown Program';
        }

        // Update the user document in the database
        await User.updateOne({ _id: user._id }, { $set: userObject });
      } catch (innerError) {
        console.error(`Error processing user with ID ${user._id}:`, innerError);
        continue; // Skip to the next user
      }
    }

    console.log('User cleanup migration completed successfully.');

    // Disconnect from the database
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during user cleanup migration:', error);
    process.exit(1);
  }
})();