import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: true, // test globals
        test: true,
        it: true,
        expect: true,
        require: true, // Node.js globals
        module: true,
        process: true,
      },
    },
    plugins: {
      js,
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
]);
