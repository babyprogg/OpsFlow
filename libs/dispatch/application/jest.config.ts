/* eslint-disable */
const nxPreset = require('../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'dispatch-application',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/dispatch/application',
  setupFilesAfterEnv: undefined,
  moduleNameMapper: {
    '^@ops-flow/dispatch/domain$': '<rootDir>/../domain/src/index.ts',
    '^@ops-flow/work-orders/domain$': '<rootDir>/../../work-orders/domain/src/index.ts'
  }
};
