const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { PROJECT_TAGS } = require('../Constants/reviewTags');

const ProjectSchema = new Schema(
  {
    projectTitle: { type: String, required: true, trim: true },
    description: { type: String },
    owner: { type: String, required: true }, // User UID of the project creator
    courseSubject: { type: String, required: true, match: /^[A-Z]{2,5}$/ }, // Matches UserSchema
    courseNumber: { type: String, required: true, match: /^[A-Z]*\d{2,4}[A-Z]*$/ },
    members: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 2; // At least two members required
        },
        message: 'A group project must have at least two members.'
      },
      required: true
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 5 && tags.every(tag => PROJECT_TAGS.includes(tag));
        },
        message: 'Invalid tags. You can select up to 5 tags from the predefined project tags.'
      }
    },
    status: {
      type: String,
      enum: ["active", "archived", "draft"],
      default: "active"
    },
    recruiting: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now }
  },
  { collection: "projects" }
);

// Indexes for efficient queries
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ courseSubject: 1, courseNumber: 1 });
ProjectSchema.index({ status: 1, recruiting: 1 });

ProjectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret._id = doc._id;
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
