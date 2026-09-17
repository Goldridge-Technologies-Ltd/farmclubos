import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src/generated", "eslint.config.mjs", "jest.config.mjs"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Nest's DI and decorator metadata rely on patterns these rules flag.
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      // ESM transpiles each file in isolation, so a type imported as a
      // value becomes a real runtime import and fails at load. The rule
      // leaves constructor-parameter types alone, which Nest's DI needs.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
    },
  },
  {
    // Jest's matcher helpers (expect.any, expect.objectContaining) are typed
    // `any` by design, so the unsafe-* rules fire on every assertion.
    files: ["**/*.spec.ts", "**/*.e2e-spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      // Specs read decorator metadata off a method reference
      // (`reflector.get(KEY, Controller.prototype.handler)`), the way Nest's
      // context.getHandler() does. The method is never called, so `this`
      // cannot be lost.
      "@typescript-eslint/unbound-method": "off",
    },
  },
);
