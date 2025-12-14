/**
 * Controlled Vocabulary for Course Review Tags
 * Used by Review schema for validation
 */

// Tags for courses
const COURSE_TAGS = [
  'Heavy workload',
  'Exam-heavy',
  'Project-based',
  'Group projects',
  'Clear grading',
  'Flexible deadlines',
  'Industry relevance',
  'Theory-focused',
  'Practical labs',
  'Presentation required',
  'Teamwork essential',
  'Fast-paced',
  'Math-intensive',
  'Writing-intensive',
  'Lots of reading',
  'Interactive',
  'Requires prior knowledge'
];

// Tags for projects
const PROJECT_TAGS = [
  'JavaScript',
  'Machine Learning',
  'Casual',
  'Serious',
  'Teamwork essential',
  'Frontend',
  'Backend',
  'Full-stack',
  'AI-focused',
  'Blockchain',
  'Mobile development',
  'Game development',
  'Portfolio-worthy',
  'Highly collaborative'
];

// Grades that allow review (completed or withdrawn)
const REVIEWABLE_GRADES = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D',
  'F',
  'P',  // Pass
  'W'   // Withdrawn
];

// Grades that don't allow review (still in progress or incomplete)
const NON_REVIEWABLE_GRADES = ['I', 'In Progress'];

// Minimum reviews required to show aggregates
const MIN_REVIEWS_FOR_AGGREGATES = 3;

module.exports = {
  COURSE_TAGS,
  PROJECT_TAGS,
  REVIEWABLE_GRADES,
  NON_REVIEWABLE_GRADES,
  MIN_REVIEWS_FOR_AGGREGATES
};
