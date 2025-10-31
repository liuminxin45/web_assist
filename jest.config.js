module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@platform/(.*)$': '<rootDir>/packages/platform/$1',
    '^@core/(.*)$': '<rootDir>/packages/core/$1',
    '^@testing/(.*)$': '<rootDir>/packages/testing/$1',
    '^@platform-web/(.*)$': '<rootDir>/packages/platform-web/$1',
    '^@platform-electron/(.*)$': '<rootDir>/packages/platform-electron/$1',
    '^@platform-webext/(.*)$': '<rootDir>/packages/platform-webext/$1'
  },
  modulePaths: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)', '**/*.(test|spec).(ts|tsx)']
};