import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "backend/dist/**",
      "frontend/dist/**",
      "frontend/.angular/**",
      "coverage/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["backend/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./backend/tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["frontend/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./frontend/tsconfig.app.json",
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser
      }
    }
  }
);
