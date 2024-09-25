module.exports = {
  coverageReporters: ['text', 'json', 'html', 'cobertura', 'lcov'],
  testResultsProcessor: 'jest-junit',
  projects: ['<rootDir>/backend/jest.config.js'],
  reporters: [
    [
      'jest-html-reporters',
      {
        publicPath: './jest-html-report',
      },
    ],
  ],
}
