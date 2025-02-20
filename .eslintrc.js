// File: .eslintrc.js
module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "prettier"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
    ],
    env: {
        node: true,
        jest: true
    },
    rules: {
        "prettier/prettier": "error",
        "@typescript-eslint/explicit-function-return-type": "warn",
        "@typescript-eslint/no-explicit-any": "warn"
    },
    root: true,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    overrides: [
        {
            files: ["src/**/*.ts"],
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "./tsconfig.json"
            }
        },
        {
            files: ["tests/**/*.ts"],
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: "./tests/tsconfig.json"
            }
        }
    ]
};