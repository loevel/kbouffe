/** @type {import('jest').Config} */
module.exports = {
    projects: [
        {
            displayName: 'unit',
            preset: 'jest-expo/node',
            testMatch: ['**/__tests__/**/*.test.ts'],
            transform: {
                '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
            },
            transformIgnorePatterns: [
                'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|zustand)',
            ],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/$1',
            },
        },
    ],
};
