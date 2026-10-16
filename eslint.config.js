const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'src/core/database/migrations/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
    ],
  },
];
