import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "error",
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  // Ignore utility scripts
  {
    ignores: ["check-db-data.js", "test-api-validation.js", "update-db.js", "update-user-role.js"],
  },
  baseConfig,
  jsxA11yConfig,
  reactConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier,
  // Allow console in E2E tests and scripts
  {
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // Relax rules for components and API routes (warnings instead of errors)
  {
    files: ["src/components/**/*.{ts,tsx}", "src/pages/api/**/*.ts"],
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  // Relax rules for test files
  {
    files: ["src/test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-useless-constructor": "off",
    },
  },
  // Relax specific rules for schemas and utilities
  {
    files: ["src/lib/**/*.ts", "src/pages/teryt/**/*.astro"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Relax for shadcn/ui components (they have their own patterns)
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "jsx-a11y/label-has-associated-control": "off",
    },
  },
  // Relax react-compiler rules (it's still experimental)
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "react-compiler/react-compiler": "warn",
    },
  }
);
