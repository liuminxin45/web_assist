/**
 * .eslintrc.js
 * 
 * ESLint 配置文件
 * 
 * 功能说明：
 * - 定义项目的代码质量规则和编码规范
 * - 为不同类型的文件（TypeScript、JavaScript、测试文件）提供特定配置
 * - 集成TypeScript支持和TypeScript-ESLint插件
 * - 确保与Prettier格式化工具兼容
 * 
 * 配置结构：
 * - root: 声明此为项目根配置，不继承父目录配置
 * - extends: 继承基础规则集
 * - env: 定义代码运行环境
 * - rules: 核心规则配置
 * - overrides: 为特定文件类型提供差异化配置
 * 
 * 主要规则说明：
 * - 生产环境禁用console和debugger
 * - TypeScript文件启用类型检查相关规则
 * - 测试文件提供特殊环境和规则豁免
 * - JavaScript文件使用基础ESLint规则
 * 
 * @file .eslintrc.js
 * @author 项目团队
 * @license MIT
 */

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
