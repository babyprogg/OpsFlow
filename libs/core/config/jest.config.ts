/* eslint-disable */
const nxPreset = require('../../../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'core-config',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/core/config',
  setupFilesAfterEnv: undefined
};

