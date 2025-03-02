const baseConfig = require('./jest.config.base');

/** @type {import('ts-jest').JestConfigWithTsJest} */
const backendConfig = {
  ...baseConfig,
  testEnvironment: 'node',
  setupFiles: ['./tests/unit/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/backend/**/*.test.ts']
};

module.exports = backendConfig; 