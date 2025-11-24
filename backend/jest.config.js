module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!db/graph.db',
  ],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/'],
  verbose: true,
};
