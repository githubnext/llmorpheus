(function () {

  module.exports = {
      "env": {
          "browser": true,
          "es6": true,
          "node": true
      },
      "extends": ["prettier"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
          "project": "./tsconfig.json",
          "sourceType": "module",
          "tsconfigRootDir": __dirname,
      },
      "plugins": [
          "eslint-plugin-jsdoc",
          "eslint-plugin-import",
          "eslint-plugin-unicorn",
          "eslint-plugin-prefer-arrow",
          "eslint-plugin-no-null",
          "@typescript-eslint",
          "@typescript-eslint/tslint",
          "prettier"
      ],
      "root": true,
      "rules": {
        'prettier/prettier': [
            'off',
            { 'endOfLine': "auto" }
          ],
          "@typescript-eslint/array-type": "off",
          "@typescript-eslint/consistent-type-assertions": "off",
          "@typescript-eslint/consistent-type-definitions": "error",
          "@typescript-eslint/dot-notation": "off",
          "@typescript-eslint/explicit-function-return-type": [
              "error",
              {
                  "allowExpressions": false,
                  "allowTypedFunctionExpressions": false,
                  "allowHigherOrderFunctions": false,
                  "allowDirectConstAssertionInArrowFunctions": true,
                  "allowConciseArrowFunctionExpressionsStartingWithVoid": true
              }
          ],
          "@typescript-eslint/explicit-member-accessibility": [
              "error",
              {
                  "accessibility": "explicit"
              }
          ],
          "@typescript-eslint/explicit-module-boundary-types": [
              "error",
              {
                  "allowArgumentsExplicitlyTypedAsAny": true,
                  "allowDirectConstAssertionInArrowFunctions": true,
                  "allowHigherOrderFunctions": false,
                  "allowTypedFunctionExpressions": false
              }
          ],
          "@typescript-eslint/indent": ["error", 2],
          "@typescript-eslint/member-delimiter-style": [
              "error",
              {
                  "multiline": {
                      "delimiter": "semi",
                      "requireLast": true
                  },
                  "singleline": {
                      "delimiter": "semi",
                      "requireLast": false
                  }
              }
          ],
          "@typescript-eslint/member-ordering": "error",
          "@typescript-eslint/naming-convention": [
              "error",
              {
                  "selector": "variable",
                  "format": [
                      "camelCase",
                      "UPPER_CASE",
                      "PascalCase",
                      "snake_case"
                  ],
                  "leadingUnderscore": "allow",
                  "trailingUnderscore": "allow"
              }
          ],
          "@typescript-eslint/no-empty-function": "error",
          "@typescript-eslint/no-extraneous-class": "off",
          "@typescript-eslint/no-inferrable-types": "off",
          "@typescript-eslint/no-misused-new": "error",
          "@typescript-eslint/no-non-null-assertion": "error",
          "@typescript-eslint/no-require-imports": "off",
          "@typescript-eslint/no-shadow": [
              "error",
              {
                  "hoist": "all"
              }
          ],
          "@typescript-eslint/no-unused-expressions": "error",
          "@typescript-eslint/no-unused-vars": "error",
          "@typescript-eslint/no-use-before-define": "error",
          "@typescript-eslint/no-var-requires": "off",
          "@typescript-eslint/prefer-for-of": "off",
          "@typescript-eslint/prefer-function-type": "error",
          "@typescript-eslint/prefer-namespace-keyword": "error",
          "@typescript-eslint/quotes": [
              "error",
              "single"
          ],
          "@typescript-eslint/semi": [
              "error",
              "always"
          ],
          "@typescript-eslint/type-annotation-spacing": "error",
          "@typescript-eslint/typedef": [
              "error",
              {
                  "parameter": true,
                  "arrowParameter": true,
                  "propertyDeclaration": true,
                  "variableDeclaration": true,
                  "memberVariableDeclaration": true,
                  "objectDestructuring": true,
                  "arrayDestructuring": true
              }
          ],
          "@typescript-eslint/unified-signatures": "error",
          "arrow-body-style": "error",
          "arrow-parens": [
              "off",
              "always"
          ],
          "brace-style": [
              "error",
              "1tbs"
          ],
          "class-methods-use-this": "off",
          "comma-dangle": "error",
          "complexity": "error",
          "constructor-super": "error",
          "curly": "error",
          "default-case": "error",
          "dot-notation": "off",
          "eol-last": "error",
          "eqeqeq": [
              "error",
              "smart"
          ],
          "guard-for-in": "off",
          "id-denylist": [
              "error",
              "any",
              "Number",
              "number",
              "String",
              "string",
              "Boolean",
              "boolean",
              "Undefined",
              "undefined"
          ],
          "id-match": "error",
          "import/no-deprecated": "warn",
          "import/no-extraneous-dependencies": "off",
          "import/order": [
              "off",
              {
                  "alphabetize": {
                      "caseInsensitive": true,
                      "order": "asc"
                  },
                  "newlines-between": "ignore",
                  "groups": [
                      [
                          "builtin",
                          "external",
                          "internal",
                          "unknown",
                          "object",
                          "type"
                      ],
                      "parent",
                      [
                          "sibling",
                          "index"
                      ]
                  ],
                  "distinctGroup": false,
                  "pathGroupsExcludedImportTypes": [],
                  "pathGroups": [
                      {
                          "pattern": "./",
                          "patternOptions": {
                              "nocomment": true,
                              "dot": true
                          },
                          "group": "sibling",
                          "position": "before"
                      },
                      {
                          "pattern": ".",
                          "patternOptions": {
                              "nocomment": true,
                              "dot": true
                          },
                          "group": "sibling",
                          "position": "before"
                      },
                      {
                          "pattern": "..",
                          "patternOptions": {
                              "nocomment": true,
                              "dot": true
                          },
                          "group": "parent",
                          "position": "before"
                      },
                      {
                          "pattern": "../",
                          "patternOptions": {
                              "nocomment": true,
                              "dot": true
                          },
                          "group": "parent",
                          "position": "before"
                      }
                  ]
              }
          ],
          "indent": "off",
          "jsdoc/check-alignment": "off",
          "jsdoc/check-indentation": "off",
          "jsdoc/newline-after-description": "off",
          "jsdoc/no-types": "error",
          "max-classes-per-file": [
              "error",
              3
          ],
          "max-len": [
              "error",
              {
                  "code": 140
              }
          ],
          "max-lines": [
              "error",
              300
          ],
          "new-parens": "error",
          "newline-per-chained-call": "off",
          "no-bitwise": "off",
          "no-caller": "error",
          "no-cond-assign": "error",
          "no-console": [
              "error",
              {
                  "allow": [
                      "log",
                      "warn",
                      "dir",
                      "timeLog",
                      "assert",
                      "clear",
                      "count",
                      "countReset",
                      "group",
                      "groupEnd",
                      "table",
                      "dirxml",
                      "error",
                      "groupCollapsed",
                      "Console",
                      "profile",
                      "profileEnd",
                      "timeStamp",
                      "context"
                  ]
              }
          ],
          "no-debugger": "error",
          "no-duplicate-imports": "error",
          "no-empty": "error",
          "no-empty-function": "off",
          "no-eval": "error",
          "no-fallthrough": "error",
          "no-invalid-this": "error",
          "no-multiple-empty-lines": [
              "error",
              {
                  "max": 2
              }
          ],
          "no-new-wrappers": "error",
          "no-null/no-null": "off",
          "no-redeclare": "error",
          "no-restricted-imports": [
              "error",
              "rxjs/Rx"
          ],
          "no-shadow": "off",
          "no-sparse-arrays": "error",
          "no-throw-literal": "error",
          "no-trailing-spaces": "error",
          "no-undef-init": "error",
          "no-underscore-dangle": "off",
          "no-unused-expressions": "off",
          "no-unused-labels": "error",
          "no-unused-vars": "off",
          "no-use-before-define": "off",
          "no-var": "error",
          "object-shorthand": "off",
          "one-var": [
              "off",
              "never"
          ],
          "padding-line-between-statements": [
              "off",
              {
                  "blankLine": "always",
                  "prev": "*",
                  "next": "return"
              }
          ],
          "prefer-arrow/prefer-arrow-functions": "off",
          "prefer-const": "error",
          "prefer-object-spread": "off",
          "prefer-template": "off",
          "quotes": "off",
          "radix": "error",
          "semi": "off",
          "space-before-function-paren": [
              "error",
              {
                  "anonymous": "never",
                  "named": "never",
                  "asyncArrow": "always"
              }
          ],
          "space-in-parens": [
              "error",
              "never"
          ],
          "spaced-comment": [
              "error",
              "always",
              {
                  "markers": [
                      "/"
                  ]
              }
          ],
          "unicorn/prefer-ternary": "off",
          "@typescript-eslint/tslint/config": [
              "error",
              {
                  "rules": {
                      "import-spacing": true,
                      "whitespace": [
                          true,
                          "check-branch",
                          "check-decl",
                          "check-operator",
                          "check-separator",
                          "check-type"
                      ]
                  }
              }
          ]
      }
  };
  

}());