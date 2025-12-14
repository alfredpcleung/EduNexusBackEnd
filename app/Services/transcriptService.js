/**
 * Transcript Service
 * Handles academic transcript operations and GPA calculations
 * Supports multiple GPA schemes (Centennial College 4.5, US 4.0, ECTS)
 */

/**
 * GPA Schemes - Extensible grade-to-points mappings
 * Each scheme defines its own scale and grade mappings
 */
const GPA_SCHEMES = {
  // Centennial College 4.5 Scale (Default)
  centennial: {
    name: 'Centennial College',
    scale: 4.5,
    grades: {
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
      'F': 0.0
    }
  },
  // US Standard 4.0 Scale
  us: {
    name: 'US Standard',
    scale: 4.0,
    grades: {
      'A+': 4.0,
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
      'F': 0.0
    }
  },
  // ECTS European Scale (placeholder - typically uses letter grades A-F)
  ects: {
    name: 'ECTS European',
    scale: 4.0,
    grades: {
      'A+': 4.0,
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
      'F': 0.0
    }
  }
};

// Grades excluded from GPA calculation (applies to all schemes)
const EXCLUDED_GRADES = ['P', 'I', 'W', 'In Progress'];

// Default scheme for backward compatibility
const DEFAULT_SCHEME = 'centennial';

/**
 * Legacy grade mapping (for backward compatibility)
 * @deprecated Use GPA_SCHEMES instead
 */
const GRADE_TO_GPA = {
  ...GPA_SCHEMES.centennial.grades,
  'P': null,
  'I': null,
  'W': null,
  'In Progress': null
};

/**
 * Calculate GPA from transcript entries
 * Primary function for GPA calculation with extensible scheme support
 * 
 * Formula: GPA = Σ(gradePoints × creditHours) / Σ(creditHours)
 * Excludes grades "P", "I", "W", "In Progress" from calculation.
 * 
 * @param {Array} transcriptEntries - Array of academic records (subject, courseCode, grade, creditHours, term, year)
 * @param {string} [scheme='centennial'] - GPA scheme to use ('centennial', 'us', 'ects')
 * @returns {number|null} GPA rounded to 3 decimal places, or null if no valid graded courses
 */
function calculateGPA(transcriptEntries, scheme = DEFAULT_SCHEME) {
  if (!Array.isArray(transcriptEntries) || transcriptEntries.length === 0) {
    return null;
  }

  const gradeMapping = GPA_SCHEMES[scheme]?.grades || GPA_SCHEMES[DEFAULT_SCHEME].grades;
  
  let totalGradePoints = 0;
  let totalCreditHours = 0;

  transcriptEntries.forEach((record) => {
    const grade = record.grade;
    const creditHours = record.creditHours || 0;

    // Skip excluded grades (P, I, W, In Progress)
    if (EXCLUDED_GRADES.includes(grade)) {
      return;
    }

    const gpaPoints = gradeMapping[grade];
    if (gpaPoints !== undefined) {
      totalGradePoints += gpaPoints * creditHours;
      totalCreditHours += creditHours;
    }
  });

  // Return null if no valid graded courses
  if (totalCreditHours === 0) {
    return null;
  }

  return parseFloat((totalGradePoints / totalCreditHours).toFixed(3));
}

/**
 * Calculate cumulative weighted GPA from courses (detailed version)
 * 
 * Formula: Σ(grade points × credit hours) / Σ(credit hours)
 * Only grades with GPA values are included in calculation.
 * Pass (P), Incomplete (I), Withdrawn (W), and In Progress are excluded.
 * 
 * @param {Array} courses - Array of course objects
 * @param {string} [scheme='centennial'] - GPA scheme to use
 * @returns {Object} Object containing cumulative GPA and calculation details
 *   - gpa: {number|null} Cumulative GPA (rounded to 3 decimal places), null if no valid grades
 *   - scheme: {string} GPA scheme used
 *   - scale: {number} Maximum GPA scale for the scheme
 *   - totalCreditHours: {number} Total credit hours attempted
 *   - creditHoursEarned: {number} Credit hours earned (from graded courses)
 *   - recordsIncluded: {number} Number of records included in calculation
 *   - recordsExcluded: {number} Number of records excluded from calculation
 *   - gradeBreakdown: {Object} Count of each grade received
 */
function calculateCumulativeGPA(courses = [], scheme = DEFAULT_SCHEME) {
  const schemeConfig = GPA_SCHEMES[scheme] || GPA_SCHEMES[DEFAULT_SCHEME];
  const gradeMapping = schemeConfig.grades;

  if (!Array.isArray(courses) || courses.length === 0) {
    return {
      gpa: null,
      scheme: schemeConfig.name,
      scale: schemeConfig.scale,
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

  courses.forEach((record) => {
    const grade = record.grade;
    const creditHours = record.creditHours || 0;

    // Track grade breakdown
    gradeBreakdown[grade] = (gradeBreakdown[grade] || 0) + 1;

    // All records count toward total credit hours attempted
    totalCreditHours += creditHours;

    // Skip excluded grades
    if (EXCLUDED_GRADES.includes(grade)) {
      recordsExcluded++;
      return;
    }

    const gpaPoints = gradeMapping[grade];
    if (gpaPoints !== undefined) {
      totalGradePoints += gpaPoints * creditHours;
      creditHoursEarned += creditHours;
      recordsIncluded++;
    } else {
      recordsExcluded++;
    }
  });

  // Calculate GPA: return null if no valid graded courses
  const cumulativeGPA = creditHoursEarned > 0 
    ? parseFloat((totalGradePoints / creditHoursEarned).toFixed(3))
    : null;

  return {
    gpa: cumulativeGPA,
    scheme: schemeConfig.name,
    scale: schemeConfig.scale,
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
 * @param {Array} courses - Array of course objects
 * @param {string} term - Semester term (e.g., "Fall", "Winter", "Spring", "Summer")
 * @param {number} year - Academic year (e.g., 2025)
 * @param {string} [scheme='centennial'] - GPA scheme to use
 * @returns {Object} Object containing term GPA and calculation details
 */
function calculateTermGPA(courses = [], term, year, scheme = DEFAULT_SCHEME) {
  const schemeConfig = GPA_SCHEMES[scheme] || GPA_SCHEMES[DEFAULT_SCHEME];
  const gradeMapping = schemeConfig.grades;

  const termRecords = courses.filter(
    (record) => record.term === term && record.year === year
  );

  if (termRecords.length === 0) {
    return {
      gpa: null,
      term,
      year,
      scheme: schemeConfig.name,
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

    totalCreditHours += creditHours;

    // Skip excluded grades
    if (EXCLUDED_GRADES.includes(grade)) {
      recordsExcluded++;
      return;
    }

    const gpaPoints = gradeMapping[grade];
    if (gpaPoints !== undefined) {
      totalGradePoints += gpaPoints * creditHours;
      creditHoursEarned += creditHours;
      recordsIncluded++;
    } else {
      recordsExcluded++;
    }
  });

  const termGPA = creditHoursEarned > 0
    ? parseFloat((totalGradePoints / creditHoursEarned).toFixed(3))
    : null;

  return {
    gpa: termGPA,
    term,
    year,
    scheme: schemeConfig.name,
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
 * @param {Array} courses - Array of course objects
 * @param {string} [scheme='centennial'] - GPA scheme to use
 * @returns {Object} Object keyed by "term-year" with GPA info for each
 */
function getGPAByTerm(courses = [], scheme = DEFAULT_SCHEME) {
  const termMap = {};

  courses.forEach((record) => {
    const key = `${record.term}-${record.year}`;
    if (!termMap[key]) {
      termMap[key] = [];
    }
    termMap[key].push(record);
  });

  const results = {};
  Object.entries(termMap).forEach(([key, records]) => {
    const [term, year] = key.split('-');
    results[key] = calculateTermGPA(courses, term, parseInt(year), scheme);
  });

  return results;
}

/**
 * Get available GPA schemes
 * @returns {Object} Available schemes with their configurations
 */
function getAvailableSchemes() {
  return Object.entries(GPA_SCHEMES).reduce((acc, [key, config]) => {
    acc[key] = { name: config.name, scale: config.scale };
    return acc;
  }, {});
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
  calculateGPA,
  calculateCumulativeGPA,
  calculateTermGPA,
  getGPAByTerm,
  getAvailableSchemes,
  validateAcademicRecord,
  GPA_SCHEMES,
  EXCLUDED_GRADES,
  DEFAULT_SCHEME,
  GRADE_TO_GPA // Deprecated: kept for backward compatibility
};
