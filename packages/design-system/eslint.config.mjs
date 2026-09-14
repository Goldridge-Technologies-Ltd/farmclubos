import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    // A component package has no pages/ directory for this rule to check.
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
];

export default eslintConfig;
