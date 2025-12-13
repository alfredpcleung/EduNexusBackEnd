const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { REVIEW_TAGS } = require('../Constants/reviewTags');

/**
 * Review Schema
 * Student reviews for courses, linked to transcript entries
 * Aggregated metrics stored in CourseSchema
 */
const ReviewSchema = new Schema(
  {
    // Identifiers
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true
    },
    authorUid: {
      type: String,
      required: [true, 'Author UID is required'],
      index: true
    },

    // Context (matches transcript format)
    term: {
      type: String,
      enum: ['Fall', 'Winter', 'Spring', 'Summer', 'Quarter1', 'Quarter2', 'Quarter3', 'Quarter4'],
      required: [true, 'Term is required']
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year must be 2100 or earlier']
    },

    // Metrics (1-5 scale)
    difficulty: {
      type: Number,
      required: [true, 'Difficulty rating is required'],
      min: [1, 'Difficulty must be at least 1'],
      max: [5, 'Difficulty cannot exceed 5']
    },
    usefulness: {
      type: Number,
      required: [true, 'Usefulness rating is required'],
      min: [1, 'Usefulness must be at least 1'],
      max: [5, 'Usefulness cannot exceed 5']
    },
    workload: {
      type: Number,
      required: [true, 'Workload rating is required'],
      min: [1, 'Workload must be at least 1'],
      max: [5, 'Workload cannot exceed 5']
    },
    gradingFairness: {
      type: Number,
      required: [true, 'Grading fairness rating is required'],
      min: [1, 'Grading fairness must be at least 1'],
      max: [5, 'Grading fairness cannot exceed 5']
    },

    // Tags & Comments
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.every(tag => REVIEW_TAGS.includes(tag));
        },
        message: 'Invalid tag. Must be from controlled vocabulary.'
      }
    },
    comment: {
      type: String,
      default: '',
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },

    // Moderation
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active'
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'reviews' }
);

// Compound unique index: one review per author per course per term/year
ReviewSchema.index(
  { courseId: 1, authorUid: 1, term: 1, year: 1 },
  { unique: true }
);

// Index for filtering by course and status
ReviewSchema.index({ courseId: 1, status: 1 });

// Update timestamp on save
ReviewSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

ReviewSchema.set('toJSON', {
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    ret.id = doc._id;
    // Hide authorUid if anonymous
    if (ret.isAnonymous) {
      delete ret.authorUid;
    }
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
