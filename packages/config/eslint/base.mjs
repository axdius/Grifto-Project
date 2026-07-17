import tseslint from "typescript-eslint";

/**
 * Shared base ESLint config for all workspaces.
 * Apps additionally apply the boundary rules from ./boundaries.mjs.
 */
export default tseslint.config(
  {
    ignores: ["**/.next/**", "**/dist/**", "**/node_modules/**", "**/*.config.*", "**/next-env.d.ts", "**/public/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
    },
  },
);
