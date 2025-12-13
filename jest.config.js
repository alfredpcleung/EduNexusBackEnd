module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'app/**/*.js',
    '!app/**/*.test.js',
    '!node_modules/**'
  ]
};
