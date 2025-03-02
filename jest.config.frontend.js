const baseConfig = require('./jest.config.base');

/** @type {import('ts-jest').JestConfigWithTsJest} */
const frontendConfig = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  setupFiles: ['./tests/unit/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/frontend/**/*.test.tsx'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};

module.exports = frontendConfig; 