// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*'],
        rules: {
            'import/no-unresolved': 'off',
        },
    },
    {
        // Fichiers d'outillage : ils tournent sous Node, pas dans l'app. Sans
        // ça, __dirname et require sont signalés comme non définis.
        files: ['babel.config.js', 'metro.config.js', 'eslint.config.js', 'scripts/**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { __dirname: 'readonly', require: 'readonly', module: 'writable', process: 'readonly' },
        },
    },
]);
