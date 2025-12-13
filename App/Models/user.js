const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const UserSchema = new Schema(
  {
    uid: { 
      type: String, 
      unique: true,
      default: () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    displayName: { type: String, required: true },              // Full name
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: [/.+\@.+\..+/, "Please fill a valid e-mail address"] 
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: { 
      type: String, 
      enum: ["student", "admin"], 
      default: "student" 
    },
    enrolledCourses: { type: [String], default: [] },           // Array of course IDs
    profilePic: { type: String },                               // URL to avatar
    bio: { type: String },                                      // Short biography
    linkedin: { type: String },                                 // LinkedIn profile
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password; // Never return password in JSON
  }
});

module.exports = mongoose.model('User', UserSchema);