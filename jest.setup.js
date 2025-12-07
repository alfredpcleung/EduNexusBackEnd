// Load environment variables for testing
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error logs visible for debugging
  error: console.error,
};

// Set timeout for async operations
jest.setTimeout(30000);
