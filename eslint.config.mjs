import nextConfig from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  {
    rules: {
      // Downgrade React Compiler strict rules to warnings — these require
      // significant refactoring and the app compiles/runs correctly without them.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      // Allow unescaped entities in JSX (common in prose-heavy components)
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: ["out/", ".next/", "node_modules/"],
  },
];

export default config;
