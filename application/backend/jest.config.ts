import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  displayName: {
    name: 'backend',
    color: 'blue',
  },

  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.(test|spec).(ts|js)'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
    '^.+\\.jsx?$': 'babel-jest',
  },

  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage',
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib/', '<rootDir>/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  transformIgnorePatterns: ['node_modules/(?!.*\\.js$)'],
}

export default config
