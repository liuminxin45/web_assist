# 开发指南

## 项目架构

本项目采用多平台统一架构，通过平台抽象层实现代码共享和多端运行。

### 核心模块

1. **平台抽象层 (`packages/platform/`)**
   - 定义统一的平台接口（storage、runtime、messaging）
   - 提供平台类型常量和环境检测

2. **平台实现层 (`packages/platform-*/`)**
   - `platform-web`: Web平台实现
   - `platform-webext`: 浏览器扩展实现
   - `platform-electron`: Electron实现

3. **核心逻辑层 (`packages/core/`)**
   - 实现平台无关的业务逻辑
   - 使用平台抽象接口进行操作

4. **应用层 (`apps/`)**
   - `web`: Web应用
   - `extension`: 浏览器扩展应用
   - `electron`: Electron桌面应用

## 开发流程

### 1. 环境准备

```bash
# 安装依赖并初始化husky钩子
pnpm install
pnpm prepare  # 初始化husky钩子
```

### 2. 开发命令

```bash
# 运行所有平台
pnpm dev:all

# 仅运行单个平台
pnpm dev:web      # Web应用
pnpm dev:electron # Electron应用
pnpm dev:extension # 浏览器扩展
```

### 3. 代码规范

- 使用TypeScript进行开发
- 遵循ESLint和Prettier规范
- 提交前自动运行代码检查和格式化

### 4. 提交规范

使用commitizen规范化提交信息：

```bash
pnpm commit
```

提交类型包括：

- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码风格调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

### 5. 版本管理

使用Changeset管理版本和更新日志：

```bash
# 创建变更记录
pnpm changeset

# 更新版本
pnpm changeset:version

# 发布版本
pnpm changeset:publish
```

## 扩展开发注意事项

1. 浏览器扩展使用Manifest V3
2. 后台脚本在service worker环境中运行
3. 存储使用chrome.storage API

## 插件系统开发

### 插件架构

- 项目支持通过插件扩展功能
- 插件目录位于`hosts/plugins/`
- 每个插件需要遵循特定的接口规范

### 插件开发步骤

1. 在`hosts/plugins/`创建插件目录
2. 实现插件接口
3. 使用PluginManager进行管理和调用

### 插件API

- 使用Platform接口的pluginManager属性访问插件功能
- PluginManager提供插件的发现、加载、激活和命令执行功能

## 测试

```bash
# 运行测试
pnpm test

# 运行测试覆盖率
pnpm test:coverage

# 快速验证多平台兼容性
pnpm verify
```

## 构建与部署

```bash
# 构建所有应用
pnpm build:all
```

CI/CD流程会在推送到main或develop分支时自动运行测试和构建。
