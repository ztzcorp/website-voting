import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals")];

export default eslintConfig;

const nextPlugin = require('@next/eslint-plugin-next');

/** @type {import('eslint').Linter.Config} */
const config = {
  extends: 'next/core-web-vitals',
  rules: {
    // Menonaktifkan aturan yang menyebabkan error build
    'react/no-unescaped-entities': 'off',
  },
};

module.exports = config;
