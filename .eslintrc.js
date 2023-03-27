module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: "babel-eslint"
  },
  extends: [
    "@nuxtjs",
    "plugin:nuxt/recommended",
    "plugin:vue/essential",
    "eslint:recommended"
  ],
  rules: {
    "no-console": "off",
    "no-unused-vars": "off",
    "vue/return-in-computed-property": "off",
    "no-unreachable": "off",
    "vue/no-unused-components": "off",
    "space-before-function-paren": "off",
    "vue/html-indent": "off",
    "vue/multiline-html-element-content-newline": "off"
  }
};
