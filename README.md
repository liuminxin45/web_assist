# Web Helper Multi-Platform Skeleton

一个基于现代前端技术栈的多端统一架构最小骨架项目，支持同时运行于 Web、Chrome/Firefox 扩展和 Electron 桌面应用。

## 项目结构

```
web_helper/
├── packages/
│   ├── platform/          # 平台抽象接口定义
│   ├── platform-web/      # Web 平台实现
│   ├── platform-webext/   # Chrome/Firefox 扩展平台实现
│   ├── platform-electron/ # Electron 平台实现
│   └── core/              # 核心业务逻辑（平台无关）
├── apps/
│   ├── web/               # Web 应用
│   ├── extension/         # 浏览器扩展应用
│   └── electron/          # Electron 桌面应用
├── package.json           # 根项目配置
├── tsconfig.base.json     # TypeScript 基础配置
└── .gitignore             # Git 忽略文件
```

## 核心特性

- **统一平台抽象层**：通过 `Platform` 接口封装 storage、runtime、messaging 三大核心能力
- **多端代码共享**：核心逻辑只需编写一次，可在 Web、扩展和桌面端运行
- **Monorepo 结构**：使用 pnpm workspace 管理依赖，避免版本冲突
- **TypeScript 支持**：全项目 TypeScript 类型定义，提供完整的类型安全
- **模块化设计**：清晰的责任分离，便于扩展和维护

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
# 在项目根目录执行
pnpm install
```

### 开发命令

```bash
# 运行 Web 应用（端口 5173）
pnpm dev:web

# 运行 Electron 应用
pnpm dev:electron

# 运行浏览器扩展构建监听
pnpm dev:extension

# 同时运行所有平台（推荐开发时使用）
pnpm dev:all

# 构建所有应用
pnpm build:all

# 类型检查
pnpm typecheck

# ESLint 检查
pnpm lint

# Prettier 格式化
pnpm format
```

## 平台适配机制

### 1. 统一接口定义

在 `packages/platform/index.ts` 中定义了三大核心接口：

- **PlatformStorage**：提供统一的存储能力
- **PlatformRuntime**：提供运行时信息和环境检测
- **PlatformMessaging**：提供跨上下文消息传递

### 2. 平台检测与切换

通过 `__TARGET__` 环境变量自动选择正确的平台实现：

```typescript
// 构建时注入，无需手动设置
export const platform = 
  __TARGET__ === 'web' ? webPlatform : 
  __TARGET__ === 'electron' ? electronPlatform : 
  webextPlatform;
```

### 3. 数据持久化

- **Web**：使用 localStorage
- **WebExtension**：使用 chrome.storage.local
- **Electron**：使用文件系统存储

## 多端功能验证

### Web 应用

- 访问 http://localhost:5173
- 可查看平台信息、使用计数器功能、测试消息传递

### 浏览器扩展

1. 构建扩展：`pnpm dev:extension`
2. 打开 Chrome -> 扩展管理 -> 开发者模式 -> 加载已解压的扩展
3. 选择 `apps/extension/dist` 目录
4. 点击扩展图标打开 popup 面板

### Electron 应用

1. 先启动 Web 应用：`pnpm dev:web`
2. 然后启动 Electron：`pnpm dev:electron`
3. Electron 窗口会加载本地 Web 服务器内容

## 扩展指南

### 添加新功能

1. 在 `packages/core` 中实现与平台无关的核心逻辑
2. 在各平台实现中添加必要的 API 支持
3. 在应用中调用核心逻辑

### 添加新平台

1. 在 `packages/platform` 中确保接口定义足够通用
2. 在 `packages/platform-new` 中实现平台特定代码
3. 更新平台切换逻辑以支持新平台

## 注意事项

1. Electron 应用依赖于 Web 应用服务器，请先启动 Web 应用
2. 浏览器扩展在开发模式下需要手动重新加载以应用更改
3. 生产环境构建前请确保更新版本号

## License

MIT