/**
 * Transcript Service
 * Handles academic transcript operations and GPA calculations
 */

/**
 * Grade to GPA point mapping (4.5 scale)
 * Based on common grading systems, expanded for global compatibility
 */
const GRADE_TO_GPA = {
  'A+': 4.5,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
  'P': null,      // Pass - not counted in GPA
  'I': null,      // Incomplete - not counted in GPA
  'W': null,      // Withdrawn - not counted in GPA
  'In Progress': null // In Progress - not counted in GPA
};

/**
 * Calculate cumulative weighted GPA from academic records
 * 
 * Formula: Σ(grade points × credit hours) / Σ(credit hours)
 * Only grades with GPA values are included in calculation.
 * Pass (P), Incomplete (I), Withdrawn (W), and In Progress are excluded.
 * 
 * @param {Array} academicRecords - Array of academic record objects
 * @returns {Object} Object containing cumulative GPA and calculation details
 *   - gpa: {number} Cumulative GPA (rounded to 2 decimal places)
 *   - totalCreditHours: {number} Total credit hours attempted
 *   - creditHoursEarned: {number} Credit hours earned (from graded courses)
 *   - recordsIncluded: {number} Number of records included in calculation
 *   - recordsExcluded: {number} Number of records excluded from calculation
 *   - gradeBreakdown: {Object} Count of each grade received
 */
function calculateCumulativeGPA(academicRecords = []) {
  if (!Array.isArray(academicRecords) || academicRecords.length === 0) {
    return {
      gpa: 0.0,
      totalCreditHours: 0,
      creditHoursEarned: 0,
      recordsIncluded: 0,
      recordsExcluded: 0,
      gradeBreakdown: {}
    };
  }

  let totalGradePoints = 0;
  let totalCreditHours = 0;
  let creditHoursEarned = 0;
  let recordsIncluded = 0;
  let recordsExcluded = 0;
  const gradeBreakdown = {};

  academicRecords.forEach((record) => {
    const grade = record.grade;
    const creditHours = record.creditHours || 0;
    const gpaPoints = GRADE_TO_GPA[grade];

    // Track grade breakdown
    gradeBreakdown[grade] = (gradeBreakdown[grade] || 0) + 1;

    // All records count toward total credit hours attempted
    totalCreditHours += creditHours;

    // Only include grades with GPA values
    if (gpaPoints !== null && gpaPoints !== undefined) {
      totalGradePoints += gpaPoints * creditHours;
      creditHoursEarned += creditHours;
      recordsIncluded++;
    } else {
      recordsExcluded++;
    }
  });

  // Calculate GPA: avoid division by zero
  const cumulativeGPA = creditHoursEarned > 0 
    ? parseFloat((totalGradePoints / creditHoursEarned).toFixed(2))
    : 0.0;

  return {
    gpa: cumulativeGPA,
    totalCreditHours,
    creditHoursEarned,
    recordsIncluded,
    recordsExcluded,
    gradeBreakdown
  };
}

/**
 * Calculate term GPA from records matching a specific term and year
 * 
 * @param {Array} academicRecords - Array of academic record objects
 * @param {string} term - Semester term (e.g., "Fall", "Winter", "Spring", "Summer")
 * @param {number} year - Academic year (e.g., 2025)
 * @returns {Object} Object containing term GPA and calculation details
 */
function calculateTermGPA(academicRecords = [], term, year) {
  const termRecords = academicRecords.filter(
    (record) => record.term === term && record.year === year
  );

  if (termRecords.length === 0) {
    return {
      gpa: 0.0,
      term,
      year,
      totalCreditHours: 0,
      creditHoursEarned: 0,
      recordsIncluded: 0,
      recordsExcluded: 0
    };
  }

  let totalGradePoints = 0;
  let totalCreditHours = 0;
  let creditHoursEarned = 0;
  let recordsIncluded = 0;
  let recordsExcluded = 0;

  termRecords.forEach((record) => {
    const grade = record.grade;
    const creditHours = record.creditHours || 0;
    const gpaPoints = GRADE_TO_GPA[grade];

    totalCreditHours += creditHours;

    if (gpaPoints !== null && gpaPoints !== undefined) {
      totalGradePoints += gpaPoints * creditHours;
      creditHoursEarned += creditHours;
      recordsIncluded++;
    } else {
      recordsExcluded++;
    }
  });

  const termGPA = creditHoursEarned > 0
    ? parseFloat((totalGradePoints / creditHoursEarned).toFixed(2))
    : 0.0;

  return {
    gpa: termGPA,
    term,
    year,
    totalCreditHours,
    creditHoursEarned,
    recordsIncluded,
    recordsExcluded
  };
}

/**
 * Get GPA grade breakdown by term and year
 * Useful for performance analytics
 * 
 * @param {Array} academicRecords - Array of academic record objects
 * @returns {Object} Object keyed by "term-year" with GPA info for each
 */
function getGPAByTerm(academicRecords = []) {
  const termMap = {};

  academicRecords.forEach((record) => {
    const key = `${record.term}-${record.year}`;
    if (!termMap[key]) {
      termMap[key] = [];
    }
    termMap[key].push(record);
  });

  const results = {};
  Object.entries(termMap).forEach(([key, records]) => {
    const [term, year] = key.split('-');
    results[key] = calculateTermGPA(academicRecords, term, parseInt(year));
  });

  return results;
}

/**
 * Validate academic record data before saving
 * 
 * @param {Object} record - Academic record object to validate
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function validateAcademicRecord(record) {
  const errors = [];

  // Validate subject code format
  if (!record.subject || !/^[A-Z]{2,5}$/.test(record.subject)) {
    errors.push('Subject must be 2-5 uppercase letters');
  }

  // Validate course code format
  if (!record.courseCode || !/^[A-Z]*\d{2,4}[A-Z]*$/.test(record.courseCode)) {
    errors.push('Course code must contain 2-4 digits with optional letters');
  }

  // Validate grade is in enum
  if (!record.grade || !GRADE_TO_GPA.hasOwnProperty(record.grade)) {
    errors.push(`Grade must be one of: ${Object.keys(GRADE_TO_GPA).join(', ')}`);
  }

  // Validate credit hours
  if (typeof record.creditHours !== 'number' || record.creditHours < 0) {
    errors.push('Credit hours must be a non-negative number');
  }

  // Validate term
  const validTerms = ["Fall", "Winter", "Spring", "Summer", "Quarter1", "Quarter2", "Quarter3", "Quarter4"];
  if (!record.term || !validTerms.includes(record.term)) {
    errors.push(`Term must be one of: ${validTerms.join(', ')}`);
  }

  // Validate year
  if (typeof record.year !== 'number' || record.year < 1900 || record.year > 2100) {
    errors.push('Year must be a valid number between 1900 and 2100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  calculateCumulativeGPA,
  calculateTermGPA,
  getGPAByTerm,
  validateAcademicRecord,
  GRADE_TO_GPA
};
