import type { Config } from 'jest'

const config: Config = {
  coverageReporters: ['text', 'json', 'html', 'cobertura', 'lcov'],

  projects: ['<rootDir>/backend/jest.config.ts'],

  reporters: [
    'default',

    // replaces testResultsProcessor: 'jest-junit'
    ['jest-junit', {}],

    // existing HTML reporter
    [
      'jest-html-reporters',
      {
        publicPath: './jest-html-report',
      },
    ],
  ],
}

export default config
