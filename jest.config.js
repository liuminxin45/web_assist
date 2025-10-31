module.exports = {
  preset: require.resolve('ts-jest'),
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@platform/(.*)$': '<rootDir>/packages/platform/$1',
    '^@core/(.*)$': '<rootDir>/packages/core/$1',
    '^@testing/(.*)$': '<rootDir>/packages/testing/$1',
    '^@platform-web/(.*)$': '<rootDir>/packages/platform-web/$1',
    '^@platform-electron/(.*)$': '<rootDir>/packages/platform-electron/$1',
    '^@platform-webext/(.*)$': '<rootDir>/packages/platform-webext/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  modulePaths: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': require.resolve('ts-jest')
  },
  collectCoverageFrom: [
    'packages/core/**/*.{ts,tsx}',
    'packages/platform/**/*.{ts,tsx}',
    'packages/platform-*/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    }
  }
};