import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...next,
  {
    ignores: ["node_modules/**", ".next/**", "drizzle/**"],
  },
];

export default eslintConfig;
