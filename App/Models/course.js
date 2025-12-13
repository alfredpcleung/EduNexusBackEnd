const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },        // Course title
    description: { type: String, required: true },              // Detailed description
    credits: { type: Number, default: 4 },                      // Credit hours
    owner: { type: String, required: true },                    // User ID of course creator
    studentsEnrolled: { type: [String], default: [] },          // Array of user IDs or names
    tags: { type: [String], default: [] },                      // Keywords/categories
    status: { 
      type: String, 
      enum: ["active", "archived", "draft"], 
      default: "active" 
    }
  },
  { collection: "courses" }
);

CourseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret._id = doc._id; // Keep the _id for API responses
  }
});

module.exports = mongoose.model('Course', CourseSchema);