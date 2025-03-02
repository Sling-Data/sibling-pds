/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = {
  moduleNameMapper: {
    '^@frontend/(.*)$': '<rootDir>/src/frontend/src/$1',
    '^@backend/(.*)$': '<rootDir>/src/backend/$1'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'
  }
};

module.exports = baseConfig; 