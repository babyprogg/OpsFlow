/* eslint-disable */
const path = require('path');
const nxPreset = require('../../../jest.preset.js');

export default {
  ...nxPreset,
  displayName: 'inventory-application',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@ops-flow/inventory/domain$': path.resolve(__dirname, '../domain/src/index.ts')
  },
  transform: {
    '^.+\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../../../tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/inventory/application',
  setupFilesAfterEnv: undefined
};