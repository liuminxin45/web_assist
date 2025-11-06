/**
 * .prettierrc.js
 * 
 * Prettier 代码格式化配置文件
 * 
 * 功能说明：
 * - 定义项目中代码的格式化规则和风格
 * - 确保团队成员代码风格一致性
 * - 与编辑器、ESLint 等工具集成，实现自动化格式化
 * - 适用于 TypeScript、JavaScript、JSX、HTML、CSS 等多种文件格式
 * 
 * 配置结构：
 * - 格式化宽度、缩进等基础设置
 * - 引号、分号、逗号等语法相关设置
 * - JSX 特定设置
 * - 文件换行符和空白处理设置
 * - 嵌入式代码格式化设置
 * 
 * 主要规则说明：
 * - printWidth: 每行最大字符数为 100
 * - tabWidth: 使用 2 个空格作为缩进
 * - semi: 语句末尾添加分号
 * - singleQuote: 使用单引号而非双引号
 * - trailingComma: 在 ES5 兼容的位置添加尾随逗号
 * - arrowParens: 箭头函数参数始终使用括号
 * - endOfLine: 自动适配操作系统的换行符
 * 
 * 注意事项：
 * - 此配置是项目全局配置，适用于所有子目录
 * - 配置与 ESLint 配合使用时需安装 eslint-config-prettier 避免冲突
 * - 推荐在编辑器中安装 Prettier 插件以实现实时格式化
 * 
 * @file .prettierrc.js
 * @author 项目团队
 * @license MIT
 */

module.exports = {
  // 一行最多 100 个字符
  printWidth: 100,
  // 使用 2 个空格缩进
  tabWidth: 2,
  // 不使用制表符，使用空格
  useTabs: false,
  // 语句末尾需要分号
  semi: true,
  // 使用单引号
  singleQuote: true,
  // 对象的 key 仅在必要时使用引号
  quoteProps: 'as-needed',
  // JSX 不使用单引号
  jsxSingleQuote: false,
  // 在 ES5 兼容的位置添加尾随逗号
  trailingComma: 'es5',
  // 在对象括号之间添加空格 { foo: bar }
  bracketSpacing: true,
  // JSX 标签的闭合括号不单独占一行
  jsxBracketSameLine: false,
  // 箭头函数的参数总是使用括号
  arrowParens: 'always',
  // 不需要在文件顶部添加格式化注释
  requirePragma: false,
  // 不需要自动在文件顶部插入格式化注释
  insertPragma: false,
  // 保持 Markdown 的换行格式
  proseWrap: 'preserve',
  // HTML 空白敏感度设为 css
  htmlWhitespaceSensitivity: 'css',
  // 自动根据操作系统确定行尾换行符
  endOfLine: 'auto',
  // 嵌入式语言自动格式化
  embeddedLanguageFormatting: 'auto'
};