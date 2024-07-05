import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
    rules: {
      "no-unused-vars": [
        "warn",
        { vars: "all", args: "after-used", ignoreRestSiblings: false },
      ],
      "no-warning-comments": ["warn", {}],
      "no-irregular-whitespace": ["warn", {}],
      "no-console": ["warn", {}],
    },
  },
  {
    ignores: ["dist/", "build", ".eslintrc.mjs"],
  },
];
