/* eslint-disable */
const nxPreset = require('../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'client-application',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/client/application',
  setupFilesAfterEnv: undefined
};
