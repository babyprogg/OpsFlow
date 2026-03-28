/* eslint-disable */
import nxPreset from '../../../jest.preset.js';

export default {
  ...nxPreset,
  displayName: 'work-orders-domain',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/work-orders/domain',
  setupFilesAfterEnv: undefined
};
