# Changelog

## [Unreleased]

### Added

- Platform接口新增pluginManager属性，提供插件管理功能
- PlatformPluginManager接口，定义插件管理核心方法
- PluginMetadata接口，用于描述插件元数据

### Changed

- 更新API_DOCUMENTATION.md文档，修正与代码实现不一致的内容
- 更新PlatformStorage接口，添加泛型支持
- 优化PlatformRuntime接口方法，改为getURL和getManifest
- 重构PlatformMessaging接口类型定义
- 扩展CoreService类，添加插件管理功能支持
- 更新husky内部配置文件，优化git钩子执行

### Fixed

- 修复平台兼容性问题

## 0.1.0 - Initial Release

- 项目初始化和基础架构搭建
- 核心服务和平台抽象层实现
- 多平台支持（Web、Electron、WebExtension）
- 项目配置和文档初始化
- 多端功能测试支持和配置优化
- 多端功能快速验证机制：Jest测试框架、模拟平台层、单元测试套件和验证脚本
