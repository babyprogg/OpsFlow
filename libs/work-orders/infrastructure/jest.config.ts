/* eslint-disable */
const nxPreset = require('../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'work-orders-infrastructure',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/work-orders/infrastructure',
  setupFilesAfterEnv: undefined
};
