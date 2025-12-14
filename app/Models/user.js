const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const AuditLog = require('./auditLog');

// Academic Record Schema for student transcript (globally compatible)
const TranscriptSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    grade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "P", "I", "W", "In Progress"],
      required: true
    },
    term: {
      type: String,
      enum: ["Fall", "Winter", "Spring", "Summer", "Quarter1", "Quarter2", "Quarter3", "Quarter4"],
      required: true
    },
    year: { type: Number, required: true }
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
    firstName: { type: String, required: true, maxlength: 50 },               // First name
    lastName: { type: String, required: true, maxlength: 50 },                // Last name
    school: { type: String, required: function() { return this.role === 'student'; }, maxlength: 50 }, // School/Institution
    fieldOfStudy: { type: String, required: function() { return this.role === 'student'; }, maxlength: 50 }, // Major/Field of Study
    github: { 
      type: String, 
      match: [/^https:\/\/github\.com\/[a-zA-Z0-9_-]+$/, "GitHub URL must match the pattern https://github.com/username"] 
    },
    personalWebsite: { 
      type: String, 
      match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/, "Please provide a valid URL"] 
    },
    linkedin: { 
      type: String, 
      match: [/^https:\/\/www\.linkedin\.com\/in\/[a-zA-Z0-9_-]+$/, "LinkedIn URL must match the pattern https://www.linkedin.com/in/username"] 
    },
    bio: { type: String, maxlength: 500 },                                     // Short biography
    profilePic: { type: String },                                              // URL to avatar
    courses: { type: [TranscriptSchema], default: [] },                  // All courses (in-progress and completed)
    lastLogin: { type: Date, default: null },                                  // Last successful login timestamp
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

// Index for active students query (lastLogin within 90 days)
UserSchema.index({ role: 1, lastLogin: -1 });

// Modularized validation logic for student-specific fields
async function validateStudentFields(user) {
  if (user.role === 'student') {
    if (!user.school || !user.school.trim()) {
      throw new Error('School is required for student users');
    }
    if (!user.fieldOfStudy || !user.fieldOfStudy.trim()) {
      throw new Error('Field of study is required for student users');
    }
  }
}

// Modularized audit logging logic
async function logAuditChanges(user) {
  const modifiedFields = user.modifiedPaths();
  const changes = {};

  modifiedFields.forEach(field => {
    changes[field] = {
      old: user.get(field, null, { getters: false }),
      new: user[field]
    };
  });

  await AuditLog.create({
    userId: user._id,
    changes,
    action: 'profile_update',
    timestamp: new Date()
  });
}

UserSchema.pre('save', async function (next) {
  try {
    // Validate student-specific fields
    await validateStudentFields(this);

    // Optional: Enforce institution domain if environment variable is set
    if (process.env.ENFORCE_INSTITUTION_DOMAIN) {
      const allowedDomain = process.env.ENFORCE_INSTITUTION_DOMAIN;
      if (!this.email.endsWith('@' + allowedDomain)) {
        throw new Error(`Email must use the ${allowedDomain} domain`);
      }
    }

    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified()) return next();

    // Log audit changes
    await logAuditChanges(this);

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
 * Calculate GPA from user's courses
 * Delegates to transcriptService for calculation logic
 * @param {string} [scheme='centennial'] - GPA scheme ('centennial', 'us', 'ects')
 * @returns {number|null} GPA rounded to 3 decimal places, or null if no valid grades
 */
UserSchema.methods.calculateGPA = function (scheme = 'centennial') {
  const transcriptService = require('../Services/transcriptService');
  return transcriptService.calculateGPA(this.courses, scheme);
};

UserSchema.set('toJSON', {
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password; // Never return password in JSON
  }
});

module.exports = mongoose.model('User', UserSchema);
