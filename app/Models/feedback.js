const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema(
  {
    projectId: { type: String, required: true },                // Project._id
    authorId: { type: String, required: true },                 // User uid
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    tags: { type: [String], default: [] },                      // e.g., ["bug", "feature-request", "suggestion"]
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now }
  },
  { collection: "feedback" }
);

// Unique compound index: only one feedback per author per project
FeedbackSchema.index({ projectId: 1, authorId: 1 }, { unique: true });

// Index for finding feedback by projectId
FeedbackSchema.index({ projectId: 1 });

// Index for finding feedback by authorId
FeedbackSchema.index({ authorId: 1 });

FeedbackSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret._id = doc._id;
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
