/**
 * Unit tests for Transcript Service - GPA Calculation
 * Tests Centennial College 4.5 scale and extensible scheme support
 */

const {
  calculateGPA,
  calculateCumulativeGPA,
  calculateTermGPA,
  getGPAByTerm,
  getAvailableSchemes,
  validateAcademicRecord,
  GPA_SCHEMES,
  EXCLUDED_GRADES,
  DEFAULT_SCHEME
} = require('../App/Services/transcriptService');

describe('Transcript Service - GPA Calculation', () => {
  
  // Sample academic records for testing
  const sampleRecords = [
    { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
    { subject: 'COMP', courseCode: '213', grade: 'A', creditHours: 3, term: 'Fall', year: 2024 },
    { subject: 'MATH', courseCode: '181', grade: 'B+', creditHours: 3, term: 'Fall', year: 2024 },
    { subject: 'COMM', courseCode: '170', grade: 'B', creditHours: 3, term: 'Winter', year: 2025 },
    { subject: 'COMP', courseCode: '231', grade: 'A-', creditHours: 3, term: 'Winter', year: 2025 }
  ];

  describe('calculateGPA() - Primary Function', () => {
    
    test('should calculate GPA correctly with Centennial 4.5 scale (default)', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMP', courseCode: '213', grade: 'A', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      // (4.5*3 + 4.0*3) / 6 = 25.5/6 = 4.25
      const gpa = calculateGPA(records);
      expect(gpa).toBe(4.250);
    });

    test('should return GPA rounded to 3 decimal places', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'B+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMM', courseCode: '170', grade: 'B', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      // (4.5*3 + 3.3*3 + 3.0*3) / 9 = 32.4/9 = 3.6
      const gpa = calculateGPA(records);
      expect(gpa).toBe(3.600);
    });

    test('should return null for empty array', () => {
      expect(calculateGPA([])).toBeNull();
    });

    test('should return null for null/undefined input', () => {
      expect(calculateGPA(null)).toBeNull();
      expect(calculateGPA(undefined)).toBeNull();
    });

    test('should return null when all grades are excluded (P, I, W, In Progress)', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'P', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'W', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMM', courseCode: '170', grade: 'In Progress', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records)).toBeNull();
    });

    test('should exclude P, I, W, In Progress grades from calculation', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'P', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMM', courseCode: '170', grade: 'W', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMP', courseCode: '213', grade: 'A', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      // Only A+ and A counted: (4.5*3 + 4.0*3) / 6 = 4.25
      const gpa = calculateGPA(records);
      expect(gpa).toBe(4.250);
    });

    test('should handle F grade correctly (0.0 points)', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'F', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      // (4.5*3 + 0.0*3) / 6 = 13.5/6 = 2.25
      const gpa = calculateGPA(records);
      expect(gpa).toBe(2.250);
    });

    test('should weight GPA by credit hours', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 4, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'B', creditHours: 2, term: 'Fall', year: 2024 }
      ];
      // (4.5*4 + 3.0*2) / 6 = 24/6 = 4.0
      const gpa = calculateGPA(records);
      expect(gpa).toBe(4.000);
    });
  });

  describe('calculateGPA() - Multiple Schemes', () => {
    
    test('should use centennial scheme by default', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records)).toBe(4.500); // Centennial: A+ = 4.5
      expect(calculateGPA(records, 'centennial')).toBe(4.500);
    });

    test('should calculate with US 4.0 scale', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records, 'us')).toBe(4.000); // US: A+ = 4.0
    });

    test('should fall back to centennial for unknown scheme', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records, 'invalid_scheme')).toBe(4.500);
    });
  });

  describe('calculateCumulativeGPA() - Detailed Results', () => {
    
    test('should return detailed GPA breakdown', () => {
      const result = calculateCumulativeGPA(sampleRecords);
      
      expect(result).toHaveProperty('gpa');
      expect(result).toHaveProperty('scheme', 'Centennial College');
      expect(result).toHaveProperty('scale', 4.5);
      expect(result).toHaveProperty('totalCreditHours');
      expect(result).toHaveProperty('creditHoursEarned');
      expect(result).toHaveProperty('recordsIncluded');
      expect(result).toHaveProperty('recordsExcluded');
      expect(result).toHaveProperty('gradeBreakdown');
    });

    test('should count records correctly', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'P', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMM', courseCode: '170', grade: 'B', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      const result = calculateCumulativeGPA(records);
      
      expect(result.recordsIncluded).toBe(2);
      expect(result.recordsExcluded).toBe(1);
      expect(result.totalCreditHours).toBe(9);
      expect(result.creditHoursEarned).toBe(6);
    });

    test('should track grade breakdown', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMP', courseCode: '213', grade: 'A+', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'B', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      const result = calculateCumulativeGPA(records);
      
      expect(result.gradeBreakdown['A+']).toBe(2);
      expect(result.gradeBreakdown['B']).toBe(1);
    });

    test('should return null gpa for empty records', () => {
      const result = calculateCumulativeGPA([]);
      expect(result.gpa).toBeNull();
    });
  });

  describe('calculateTermGPA()', () => {
    
    test('should calculate GPA for specific term', () => {
      const result = calculateTermGPA(sampleRecords, 'Fall', 2024);
      
      expect(result.term).toBe('Fall');
      expect(result.year).toBe(2024);
      expect(result.recordsIncluded).toBe(3);
      // (4.5*3 + 4.0*3 + 3.3*3) / 9 = 35.4/9 = 3.933
      expect(result.gpa).toBe(3.933);
    });

    test('should return null gpa for non-existent term', () => {
      const result = calculateTermGPA(sampleRecords, 'Summer', 2024);
      expect(result.gpa).toBeNull();
      expect(result.recordsIncluded).toBe(0);
    });

    test('should include scheme info in result', () => {
      const result = calculateTermGPA(sampleRecords, 'Fall', 2024, 'us');
      expect(result.scheme).toBe('US Standard');
    });
  });

  describe('getGPAByTerm()', () => {
    
    test('should return GPA breakdown by term', () => {
      const result = getGPAByTerm(sampleRecords);
      
      expect(result).toHaveProperty('Fall-2024');
      expect(result).toHaveProperty('Winter-2025');
      expect(result['Fall-2024'].recordsIncluded).toBe(3);
      expect(result['Winter-2025'].recordsIncluded).toBe(2);
    });

    test('should return empty object for empty records', () => {
      const result = getGPAByTerm([]);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('getAvailableSchemes()', () => {
    
    test('should return available GPA schemes', () => {
      const schemes = getAvailableSchemes();
      
      expect(schemes).toHaveProperty('centennial');
      expect(schemes).toHaveProperty('us');
      expect(schemes).toHaveProperty('ects');
      expect(schemes.centennial.scale).toBe(4.5);
      expect(schemes.us.scale).toBe(4.0);
    });
  });

  describe('validateAcademicRecord()', () => {
    
    test('should validate correct record', () => {
      const record = {
        subject: 'COMP',
        courseCode: '100',
        grade: 'A+',
        creditHours: 3,
        term: 'Fall',
        year: 2024
      };
      const result = validateAcademicRecord(record);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid subject code', () => {
      const record = {
        subject: 'comp', // lowercase
        courseCode: '100',
        grade: 'A+',
        creditHours: 3,
        term: 'Fall',
        year: 2024
      };
      const result = validateAcademicRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subject must be 2-5 uppercase letters');
    });

    test('should reject invalid course code', () => {
      const record = {
        subject: 'COMP',
        courseCode: 'ABC', // no digits
        grade: 'A+',
        creditHours: 3,
        term: 'Fall',
        year: 2024
      };
      const result = validateAcademicRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Course code must contain 2-4 digits with optional letters');
    });

    test('should reject invalid grade', () => {
      const record = {
        subject: 'COMP',
        courseCode: '100',
        grade: 'E', // not in enum
        creditHours: 3,
        term: 'Fall',
        year: 2024
      };
      const result = validateAcademicRecord(record);
      expect(result.valid).toBe(false);
    });

    test('should reject invalid term', () => {
      const record = {
        subject: 'COMP',
        courseCode: '100',
        grade: 'A+',
        creditHours: 3,
        term: 'Autumn', // not in enum
        year: 2024
      };
      const result = validateAcademicRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Term must be'))).toBe(true);
    });

    test('should reject negative credit hours', () => {
      const record = {
        subject: 'COMP',
        courseCode: '100',
        grade: 'A+',
        creditHours: -3,
        term: 'Fall',
        year: 2024
      };
      const result = validateAcademicRecord(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Credit hours must be a non-negative number');
    });
  });

  describe('GPA_SCHEMES Configuration', () => {
    
    test('should have Centennial scheme with 4.5 scale', () => {
      expect(GPA_SCHEMES.centennial.scale).toBe(4.5);
      expect(GPA_SCHEMES.centennial.grades['A+']).toBe(4.5);
    });

    test('should have US scheme with 4.0 scale', () => {
      expect(GPA_SCHEMES.us.scale).toBe(4.0);
      expect(GPA_SCHEMES.us.grades['A+']).toBe(4.0);
    });

    test('should have all letter grades defined', () => {
      const expectedGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
      expectedGrades.forEach(grade => {
        expect(GPA_SCHEMES.centennial.grades).toHaveProperty(grade);
      });
    });
  });

  describe('EXCLUDED_GRADES Configuration', () => {
    
    test('should exclude P, I, W, In Progress', () => {
      expect(EXCLUDED_GRADES).toContain('P');
      expect(EXCLUDED_GRADES).toContain('I');
      expect(EXCLUDED_GRADES).toContain('W');
      expect(EXCLUDED_GRADES).toContain('In Progress');
    });
  });

  describe('Edge Cases', () => {
    
    test('should handle zero credit hours', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 0, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records)).toBeNull();
    });

    test('should handle mixed credit hours', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A+', creditHours: 4, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'C', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMM', courseCode: '170', grade: 'B+', creditHours: 2, term: 'Fall', year: 2024 }
      ];
      // (4.5*4 + 2.0*3 + 3.3*2) / 9 = (18 + 6 + 6.6) / 9 = 30.6/9 = 3.4
      const gpa = calculateGPA(records);
      expect(gpa).toBe(3.400);
    });

    test('should handle single record', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'B+', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records)).toBe(3.300);
    });

    test('should handle all same grades', () => {
      const records = [
        { subject: 'COMP', courseCode: '100', grade: 'A', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'MATH', courseCode: '181', grade: 'A', creditHours: 3, term: 'Fall', year: 2024 },
        { subject: 'COMM', courseCode: '170', grade: 'A', creditHours: 3, term: 'Fall', year: 2024 }
      ];
      expect(calculateGPA(records)).toBe(4.000);
    });
  });
});
