/* eslint-disable */
const nxPreset = require('../../../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'design-system-icons',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/design-system/icons',
  setupFilesAfterEnv: undefined
};

