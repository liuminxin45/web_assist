module.exports = {
  root: true,
  // 默认配置，不包含TypeScript特定的规则和插件
  extends: ['eslint:recommended', 'prettier'],
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  // 使用overrides来为不同类型的文件提供不同的配置
  overrides: [
    // TypeScript文件的配置
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: __dirname,
        project: './tsconfig.base.json',
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
      },
    },
    // 测试文件的配置
    {
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
    // JavaScript文件的配置
    {
      files: ['**/*.js', '**/*.jsx'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: [],
      extends: ['eslint:recommended', 'prettier'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
