const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      'dist/*',
      'build/*',
      'web-build/*',
      'node_modules/*',
      '.expo/*',
      'coverage/*',
      'ios/*',
      'android/*',
      '.tmp-export-check/*',
      'expo-env.d.ts',
    ],
  },
]);
