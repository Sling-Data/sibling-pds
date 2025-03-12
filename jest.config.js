const path = require('path');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testTimeout: 10000,
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/unit/setup.ts'],
      testMatch: ['<rootDir>/tests/unit/backend/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { 
          rootMode: 'upward',
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-typescript']
          ]
        }]
      },
      moduleNameMapper: {
        '^@backend/(.*)$': '<rootDir>/src/backend/$1'
      }
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      rootDir: path.resolve(__dirname, 'src/frontend'),
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testEnvironmentOptions: {
        pretendToBeVisual: true,
      },
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-react', { runtime: 'automatic' }],
            ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]
          ],
          plugins: ['@babel/plugin-transform-runtime']
        }],
        '\\.css$': 'jest-transform-css'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-base64|@react-navigation|@react-native-community)/)'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': path.resolve(__dirname, 'src/frontend/src/__mocks__/styleMock.ts'),
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
    }
  ]
};