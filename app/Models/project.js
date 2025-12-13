const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    owner: { type: String, required: true },                    // User uid
    courseId: { type: String },                                 // Optional ref to Course
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "archived", "draft"],
      default: "active"
    },
    recruiting: { type: Boolean, default: false },             // Whether project is recruiting members
    created: { type: Date, default: Date.now, immutable: true },
    updated: { type: Date, default: Date.now }
  },
  { collection: "projects" }
);

// Index for owner queries and courseId queries
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ courseId: 1 });
// Index for recruiting projects query
ProjectSchema.index({ status: 1, recruiting: 1 });

ProjectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret._id = doc._id;
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
