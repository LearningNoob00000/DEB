// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    moduleDirectories: ['node_modules', 'src'],

    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    },

    // Handle ES Module dependencies
    transformIgnorePatterns: [
        'node_modules/(?!(ora|cli-spinners|eastasianwidth|string-width|strip-ansi|ansi-regex)/)'
    ],

    // Test patterns
    testMatch: [
        '**/tests/**/*.test.ts'
    ],

    // Module resolution
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },

    // Coverage settings
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts'
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70
        }
    },

    // Other settings
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
