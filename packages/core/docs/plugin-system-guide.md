# 插件系统使用指南

本项目实现了一个类似VS Code的插件系统，支持跨平台（Web、Electron、WebExtension）运行和跨进程加载插件。

## 核心功能

- **动态插件加载**：运行时发现、加载和卸载插件
- **跨平台支持**：在Web、Electron和WebExtension环境中无缝工作
- **跨进程运行**：支持插件在独立进程中运行，提高安全性和稳定性
- **插件生命周期管理**：完整的激活、停用和卸载流程
- **插件API**：提供丰富的API供插件使用，包括命令、视图、消息传递等

## 架构设计

插件系统采用分层架构设计：

1. **核心层（Core）**：定义基础类型和核心管理器
2. **平台层（Platform）**：抽象平台接口，提供平台特定实现
3. **插件API层**：提供统一的API供插件使用
4. **IPC层**：处理跨进程通信

## 插件结构

一个有效的插件必须包含以下文件：

```
plugin/
├── plugin.json    # 插件元数据
└── index.js       # 插件主入口文件
```

### plugin.json 格式

```json
{
  "name": "插件名称",
  "version": "1.0.0",
  "description": "插件描述",
  "main": "index.js",
  "contributes": {
    "commands": [],
    "menus": [],
    "views": []
  },
  "activationEvents": [
    "onCommand:commandId",
    "onView:viewId"
  ]
}
```

### 插件入口文件

插件入口文件必须导出 `activate` 和可选的 `deactivate` 函数：

```javascript
export function activate(context) {
  // 插件激活逻辑
  // 注册命令、视图等
  
  // 返回插件API（可选）
  return {
    // 插件公开的方法
  };
}

export function deactivate(context) {
  // 插件停用逻辑
}
```

## 使用插件系统

### 初始化插件系统

```javascript
import { pluginManager, pluginProcessManager } from '@core/index';

// 初始化插件系统
async function initializePluginSystem() {
  try {
    // 初始化进程管理器
    await pluginProcessManager.initialize();
    
    // 发现并加载插件
    await pluginManager.discoverAndLoadPlugins();
    
    console.log('插件系统初始化成功');
  } catch (error) {
    console.error('插件系统初始化失败:', error);
  }
}

// 启动应用时调用
initializePluginSystem();
```

### 安装插件

```javascript
import { getPlatform } from '@platform/index';

async function installNewPlugin(pluginData) {
  const success = await getPlatform().pluginManager.installPlugin({
    id: 'unique-plugin-id',
    metadata: {
      name: '插件名称',
      version: '1.0.0',
      description: '插件描述',
      main: 'index.js'
    },
    code: '插件代码内容'
  });
  
  if (success) {
    console.log('插件安装成功');
    // 激活插件
    await getPlatform().pluginManager.activatePlugin('unique-plugin-id');
  }
}
```

### 卸载插件

```javascript
import { getPlatform } from '@platform/index';

async function removePlugin(pluginId) {
  const success = await getPlatform().pluginManager.uninstallPlugin(pluginId);
  if (success) {
    console.log('插件卸载成功');
  }
}
```

### 列出已安装的插件

```javascript
import { getPlatform } from '@platform/index';

async function listAllPlugins() {
  const plugins = await getPlatform().pluginManager.listInstalledPlugins();
  console.log('已安装的插件:', plugins);
  return plugins;
}
```

## 插件开发指南

### 基本插件示例

请参考 `packages/core/examples/example-plugin` 目录下的示例插件。

### 插件上下文API

插件通过 `context` 对象访问系统功能：

#### commands

```javascript
// 注册命令
context.subscriptions.push(
  context.commands.registerCommand('myPlugin.myCommand', (args) => {
    // 命令实现
    console.log('命令执行，参数:', args);
    return '命令执行结果';
  })
);

// 执行命令
const result = await context.commands.executeCommand('otherPlugin.someCommand', arg1, arg2);
```

#### services

```javascript
// 获取服务
const coreService = context.services.core;
const counterValue = await coreService.getCount();

// 注册服务
context.subscriptions.push(
  context.services.register('myPlugin.myService', {
    doSomething: () => {
      // 服务实现
    }
  })
);
```

#### views

```javascript
// 注册视图
context.subscriptions.push(
  context.views.registerView('myView', {
    title: '我的视图',
    render: () => ({
      html: '<div>视图内容</div>',
      onMount: (element) => {
        // 视图挂载后的初始化
      }
    })
  })
);
```

#### messaging

```javascript
// 发送消息
context.messaging.send('myPlugin.message', { data: '消息数据' });

// 监听消息
const unsubscribe = context.messaging.on('otherPlugin.message', (event) => {
  console.log('收到消息:', event);
});

// 取消订阅（通常会自动通过subscriptions处理）
// unsubscribe();
```

#### notifications

```javascript
// 显示通知
context.notifications.info('操作成功');
context.notifications.warning('警告信息');
context.notifications.error('错误信息');
```

#### configuration

```javascript
// 注册配置
context.subscriptions.push(
  context.configuration.registerConfiguration({
    id: 'myPlugin',
    title: '我的插件配置',
    type: 'object',
    properties: {
      option1: {
        type: 'boolean',
        default: true,
        description: '选项1'
      }
    }
  })
);

// 获取配置值
const option1 = await context.configuration.getConfiguration('myPlugin').get('option1');
```

## 跨进程运行

插件系统支持插件在独立进程中运行，提高系统安全性和稳定性。跨进程通信由IPC管理器自动处理，插件开发者无需关心底层实现细节。

```javascript
// 插件进程管理器会自动处理进程创建和通信
import { pluginProcessManager } from '@core/index';

// 配置插件在独立进程中运行
pluginProcessManager.configurePluginProcess('heavy-plugin', {
  type: 'WORKER', // 或 'NODE_PROCESS'
  timeout: 30000,
  maxMemoryUsage: '512mb'
});
```

## 平台特定注意事项

### WebExtension

- 插件存储在浏览器扩展的localStorage中
- 受限于浏览器扩展的安全策略
- 需要在background script中处理插件加载请求

### Web

- 插件存储在localStorage或发送到服务器
- 动态导入插件代码需要正确的CORS配置
- 提供了备选的插件代码执行方式

### Electron

- 插件存储在文件系统中
- 利用Node.js的fs模块读取插件文件
- 支持热重载和更灵活的插件管理

## 安全性考虑

1. 插件代码在隔离环境中执行
2. 提供最小权限原则的API访问控制
3. 支持插件签名和验证机制
4. 实现资源使用限制，防止插件滥用

## 调试插件

### 启用开发模式

```javascript
import { pluginManager } from '@core/index';

// 启用开发模式，显示详细日志
pluginManager.enableDevelopmentMode(true);
```

### 查看插件日志

插件的控制台输出会通过系统的日志系统收集和显示。

```javascript
// 监听插件日志
pluginManager.onPluginLog((pluginId, level, message) => {
  console.log(`[${pluginId}] [${level}] ${message}`);
});
```

## 示例插件

项目包含一个示例计数器插件，展示了插件系统的基本功能：

- 命令注册和执行
- 视图贡献
- 服务注册和使用
- 消息传递
- 配置管理
- 通知显示

请查看 `packages/core/examples/example-plugin` 目录获取完整示例代码。