const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const jsdoc = require("eslint-plugin-jsdoc");
const _import = require("eslint-plugin-import");
const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    extends: fixupConfigRules(compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:jsdoc/recommended",
        "plugin:import/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
    )),

    languageOptions: {
        parser: tsParser,

        globals: {
            ...globals.node,
            ...globals.jest,
        },

        ecmaVersion: 6,
        sourceType: "module",
        parserOptions: {},
    },

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        prettier,
        jsdoc: fixupPluginRules(jsdoc),
        import: fixupPluginRules(_import),
    },

    rules: {
        "arrow-parens": ["error", "always"],
        "no-unused-vars": "off",
        "no-console": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/explicit-function-return-type": "off",

        "@typescript-eslint/explicit-member-accessibility": ["error", {
            accessibility: "explicit",

            overrides: {
                accessors: "explicit",
                constructors: "no-public",
                methods: "explicit",
                properties: "off",
                parameterProperties: "explicit",
            },
        }],

        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-useless-constructor": "error",

        "@typescript-eslint/array-type": ["error", {
            default: "array-simple",
            readonly: "array-simple",
        }],

        "no-unused-expressions": ["error", {
            allowShortCircuit: true,
            allowTernary: true,
        }],

        "prettier/prettier": "error",

        "jsdoc/require-jsdoc": ["off"],

        "import/no-unresolved": "off",
        "import/order": "error",
        "object-shorthand": "error",
        "dot-notation": "error",
        "no-caller": "error",
        "no-useless-concat": "error",
        radix: "error",
        yoda: "error",
        "prefer-arrow-callback": "error",
        "prefer-rest-params": "error",
        "no-var": "error",
        "prefer-const": "error",
        "prefer-spread": "error",
        "no-shadow": "off",
        "@typescript-eslint/no-shadow": ["error"],
        "prefer-template": "error",

        "prefer-destructuring": ["error", {
            array: false,
            object: true,
        }],

        "default-case": "error",
        "jsdoc/require-param-type": 0,
        "jsdoc/require-returns-type": 0,
        indent: "off",
    },
}, {
    files: ["**/*.js"],

    rules: {
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/no-var-requires": "off",
        "no-unused-vars": ["error"],

        "prefer-destructuring": ["error", {
            AssignmentExpression: {
                object: false,
            },
        }],
    },
}, globalIgnores(["**/jest-html-report", "**/node_modules", "**/dist", "**/bundle", "**/*.config.js"])]);
