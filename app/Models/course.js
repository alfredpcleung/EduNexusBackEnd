const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Prerequisite/Corequisite Reference Schema
 * Stores course dependencies as subject + number pairs
 */
const CourseRefSchema = new Schema(
  {
    subject: {
      type: String,
      required: true,
      match: [/^[A-Z]{2,5}$/, 'Subject must be 2-5 uppercase letters']
    },
    number: {
      type: String,
      required: true,
      match: [/^\d{2,4}$/, 'Number must be 2-4 digits']
    }
  },
  { _id: false }
);

/**
 * Course Schema
 * Institution catalog entry with aggregated review metrics
 * Enrollment inferred from User transcript entries, not stored here
 */
const CourseSchema = new Schema(
  {
    // Identifiers (normalized, compound unique)
    institution: {
      type: String,
      required: [true, 'Institution is required'],
      trim: true
    },
    courseSubject: {
      type: String,
      required: [true, 'Course subject is required'],
      match: [/^[A-Z]{2,5}$/, 'Course subject must be 2-5 uppercase letters']
    },
    courseNumber: {
      type: String,
      required: [true, 'Course number is required'],
      match: [/^\d{2,4}$/, 'Course number must be 2-4 digits']
    },

    // Metadata
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    credits: {
      type: Number,
      default: 4,
      min: [0, 'Credits cannot be negative'],
      max: [12, 'Credits cannot exceed 12']
    },
    syllabusRevisionDate: {
      type: Date,
      default: null
    },

    // Relationships
    prerequisites: {
      type: [CourseRefSchema],
      default: []
    },
    corequisites: {
      type: [CourseRefSchema],
      default: []
    },

    // Aggregated Review Metrics (null if < 3 reviews)
    avgDifficulty: { type: Number, default: null, min: 1, max: 5 },
    avgUsefulness: { type: Number, default: null, min: 1, max: 5 },
    avgWorkload: { type: Number, default: null, min: 1, max: 5 },
    avgGradingFairness: { type: Number, default: null, min: 1, max: 5 },
    numReviews: { type: Number, default: 0 },
    topTags: { type: [String], default: [] },
    lastReviewAt: { type: Date, default: null },

    // Timestamps
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'courses' }
);

// Compound unique index: one course per institution + subject + number
CourseSchema.index(
  { institution: 1, courseSubject: 1, courseNumber: 1 },
  { unique: true }
);

// Text index for search
CourseSchema.index({ title: 'text', description: 'text' });

// Update timestamp on save
CourseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full course code (e.g., "COMP 246")
CourseSchema.virtual('courseCode').get(function () {
  return `${this.courseSubject} ${this.courseNumber}`;
});

CourseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret._id = doc._id; // Keep _id for backward compatibility
    ret.id = doc._id;  // Also provide id
  }
});

module.exports = mongoose.model('Course', CourseSchema);
