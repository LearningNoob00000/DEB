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
  overrides: [
    {
      files: ["src/**/*.ts"],
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    {
      files: ["tests/**/*.ts"],
      parserOptions: {
        project: "./tests/tsconfig.json"
      }
    }
  ]
};