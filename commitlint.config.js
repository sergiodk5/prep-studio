export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'header-case': [2, 'always', 'lower-case'],
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
  },
}
