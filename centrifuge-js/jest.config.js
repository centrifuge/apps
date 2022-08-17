/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // transform: {},
  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },

  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  moduleDirectories: ['node_modules', __dirname],
}
