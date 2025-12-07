const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },        // Unique identifier
    displayName: { type: String, required: true },              // Full name
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: [/.+\@.+\..+/, "Please fill a valid e-mail address"] 
    },
    role: { 
      type: String, 
      enum: ["student", "instructor", "admin"], 
      default: "student" 
    },
    enrolledCourses: { type: [String], default: [] },           // Array of course IDs
    profilePic: { type: String },                               // URL to avatar
    bio: { type: String },                                      // Short biography
    linkedin: { type: String },                                 // LinkedIn profile
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now },
    admin: { type: Boolean, default: false }
  },
  { collection: "users" }
);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('User', UserSchema);