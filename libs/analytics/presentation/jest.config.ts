/* eslint-disable */
const nxPreset = require('../../../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'analytics-presentation',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/analytics/presentation',
  setupFilesAfterEnv: undefined
};

