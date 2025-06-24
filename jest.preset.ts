/* eslint-disable */
const pathLib = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = require('./tsconfig.base.json');
const STUB_PATH = pathLib.join(__dirname, 'tools', 'jest-transform-stub.cjs');

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
    // Ignore invalid JSON in Cookiecutter template package.json by stubbing it
    'templates/microservice/.+/package.json$': STUB_PATH,
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  coverageDirectory: './coverage',
  testMatch: ['<rootDir>/src/**/*(*.)@(spec|test).[tj]s?(x)'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: '<rootDir>/',
  }),
  modulePathIgnorePatterns: ['[\\/]templates[\\/].*', '[\\/]dist[\\/].*'],
  watchPathIgnorePatterns: ['[\\/]templates[\\/].*', '[\\/]dist[\\/].*'],
  testPathIgnorePatterns: ['[\\/]templates[\\/].*', '[\\/]dist[\\/].*'],
  haste: {
    blockList: [/templates[\\/]microservice[\\/]/, /dist[\\/]/],
  },
  // Limit Jest's file system crawl to the service's src directory. This prevents it from
  // traversing sibling folders like ../../templates that contain non-JSON placeholders.
  roots: ['<rootDir>/src'],
};
