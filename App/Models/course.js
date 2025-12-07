const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },        // Course title
    description: { type: String, required: true },              // Detailed description
    credits: { type: Number, default: 3 },                      // Credit hours
    instructor: { type: String, required: true },               // Instructor name
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
    delete ret._id;
  }
});

module.exports = mongoose.model('Course', CourseSchema);