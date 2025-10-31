module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@platform/(.*)$': '<rootDir>/packages/platform/$1',
    '^@core/(.*)$': '<rootDir>/packages/core/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  modulePaths: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
  transform: {
    '^.+\.(ts|tsx)$': 'ts-jest'
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
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
};