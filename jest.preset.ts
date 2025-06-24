const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = require('./tsconfig.base.json');

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
    '<rootDir>/templates/microservice/{{cookiecutter.service_slug}}/package.json':
      '<rootDir>/tools/jest-transform-stub.cjs',
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  coverageDirectory: './coverage',
  testMatch: ['<rootDir>/src/**/*(*.)@(spec|test).[tj]s?(x)'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: '<rootDir>/',
  }),
};
