# Web Helper 部署说明

## 环境要求

- Node.js >= 16.x
- npm >= 8.x 或 pnpm >= 8.x（推荐使用pnpm以获得更好的依赖管理体验）

## 安装依赖

### 使用pnpm（推荐）
```bash
npm install -g pnpm  # 如果尚未安装pnpm
pnpm install
pnpm prepare  # 初始化husky钩子
```

### 使用npm
```bash
npm install
npm run prepare  # 初始化husky钩子
```

## 开发环境部署

### 单独启动各平台
```bash
# Web应用
npm run dev:web

# Electron应用
npm run dev:electron

# 浏览器扩展
npm run dev:extension
```

### 同时启动所有平台
```bash
npm run dev:all
```

## 生产环境构建

```bash
# 构建所有平台
npm run build:all
```

构建产物位置：
- Web应用：`apps/web/dist`
- Electron应用：`apps/electron/out`
- 浏览器扩展：`apps/extension/dist`

## 测试与验证

```bash
# 运行所有测试
npm test

# 生成测试覆盖率报告
npm run test:coverage

# 运行快速验证脚本
npm run verify
```

## CI/CD流程

项目使用GitHub Actions进行CI/CD，配置文件位于`.github/workflows/ci.yml`。

CI流程包含以下步骤：
1. 安装依赖
2. TypeScript类型检查
3. ESLint代码检查
4. 运行测试
5. 构建项目

## 浏览器扩展部署

### 开发环境
1. 运行`npm run dev:extension`
2. 打开Chrome浏览器 → 扩展管理 → 开发者模式
3. 点击"加载已解压的扩展程序"
4. 选择`apps/extension/dist`目录

### 生产环境
1. 运行`npm run build:all`
2. 使用Chrome Web Store开发者控制台上传构建产物

## 注意事项

1. 确保在部署前运行完整的测试套件
2. 生产环境部署前请更新版本号和CHANGELOG
3. 浏览器扩展发布需要遵循Chrome Web Store的审核规则