const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

// Academic Record Schema for student transcript (globally compatible)
const AcademicRecordSchema = new Schema(
  {
    subject: {
      type: String,
      match: [/^[A-Z]{2,5}$/, "Subject code must be 2-5 uppercase letters"],
      required: true
    },
    courseCode: {
      type: String,
      match: [/^[A-Z]*\d{2,4}[A-Z]*$/, "Course code must contain 2-4 digits with optional letter prefix/suffix"],
      required: true
    },
    courseTitle: { type: String },                            // optional course name
    grade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "P", "I", "W", "In Progress"],
      required: true
    },
    creditHours: { type: Number, required: true },            // integer credits
    creditSystem: {
      type: String,
      enum: ["Credit Hours", "ECTS"],
      default: "Credit Hours"
    },
    term: {
      type: String,
      enum: ["Fall", "Winter", "Spring", "Summer", "Quarter1", "Quarter2", "Quarter3", "Quarter4"],
      required: true
    },
    year: { type: Number, required: true }                    // e.g., 2025
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    uid: { 
      type: String, 
      unique: true,
      default: () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
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
    firstName: { type: String, required: true },               // First name
    lastName: { type: String, required: true },                // Last name
    schoolName: { type: String },                              // School/Institution (required for students)
    programName: { type: String },                             // Major/Field of Study/Program (required for students, globally flexible)
    github: { type: String },                                  // GitHub profile URL
    personalWebsite: { type: String },                         // Personal website/portfolio URL
    linkedin: { type: String },                                // LinkedIn profile
    bio: { type: String },                                     // Short biography
    profilePic: { type: String },                              // URL to avatar
    enrolledCourses: { type: [String], default: [] },          // Array of course IDs
    academicRecords: { type: [AcademicRecordSchema], default: [] }, // Student academic transcript
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

// Validate role-specific required fields and handle email domain enforcement
UserSchema.pre('save', async function (next) {
  try {
    // For student users, schoolName and programName are required
    if (this.role === 'student') {
      if (!this.schoolName || !this.schoolName.trim()) {
        throw new Error('School Name is required for student users');
      }
      if (!this.programName || !this.programName.trim()) {
        throw new Error('Program Name is required for student users');
      }
    }

    // Optional: Enforce institution domain if environment variable is set
    if (process.env.ENFORCE_INSTITUTION_DOMAIN) {
      const allowedDomain = process.env.ENFORCE_INSTITUTION_DOMAIN;
      if (!this.email.endsWith('@' + allowedDomain)) {
        throw new Error(`Email must use the ${allowedDomain} domain`);
      }
    }

    // Hash password if modified
    if (!this.isModified('password')) {
      return next();
    }

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

/**
 * Calculate GPA from user's academic records
 * Delegates to transcriptService for calculation logic
 * @param {string} [scheme='centennial'] - GPA scheme ('centennial', 'us', 'ects')
 * @returns {number|null} GPA rounded to 3 decimal places, or null if no valid grades
 */
UserSchema.methods.calculateGPA = function (scheme = 'centennial') {
  const transcriptService = require('../Services/transcriptService');
  return transcriptService.calculateGPA(this.academicRecords, scheme);
};

UserSchema.set('toJSON', {
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password; // Never return password in JSON
  }
});

module.exports = mongoose.model('User', UserSchema);