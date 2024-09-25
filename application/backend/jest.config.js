/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.(test|spec).(ts|js)'],
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/dist/'],
  modulePathIgnorePatterns: ['dist'],
  displayName: {
    color: 'blue',
    name: 'backend',
  },
}
