# API 文档

本文档详细介绍Web Helper多平台项目的核心API接口。

## 1. 平台抽象层 API

### 1.1 Platform 接口

```typescript
interface Platform {
  storage: PlatformStorage;
  runtime: PlatformRuntime;
  messaging: PlatformMessaging;
  pluginManager: PlatformPluginManager;
  name: 'web' | 'electron' | 'webext';
}
```

### 1.2 PlatformStorage 接口

提供统一的存储能力：

```typescript
interface PlatformStorage {
  // 设置存储项
  set<T = unknown>(key: string, value: T): Promise<void>;

  // 获取存储项
  get<T = unknown>(key: string): Promise<T | undefined>;

  // 移除存储项
  remove(key: string): Promise<void>;
}
```

**使用示例：**

```typescript
import { platform } from '@platform/index';

// 保存数据
await platform.storage.set('userSettings', { theme: 'dark' });

// 读取数据
const settings = await platform.storage.get('userSettings');

// 删除数据
await platform.storage.remove('temporaryData');
```

### 1.3 PlatformRuntime 接口

提供运行时信息和环境：

```typescript
interface PlatformRuntime {
  // 获取资源URL
  getURL(path: string): string;

  // 获取应用清单
  getManifest(): Record<string, unknown>;
}
```

**使用示例：**

```typescript
import { platform } from '@platform/index';

// 获取版本信息
const version = platform.runtime.getVersion();

// 获取平台信息
const platformInfo = platform.runtime.getPlatformInfo();
console.log(`Running on ${platformInfo.os} ${platformInfo.arch}`);

// 开发模式检测
if (platform.runtime.isDevMode()) {
  console.log('Development mode enabled');
}
```

### 1.4 PlatformMessaging 接口

提供跨上下文消息传递：

```typescript
export type MessageData = Record<string, unknown>;

interface PlatformMessaging {
  // 发送消息
  sendMessage<T = unknown>(message: MessageData): Promise<T | undefined>;

  // 监听消息
  onMessage(callback: (message: MessageData) => void): void;

  // 移除消息监听
  offMessage(callback: (message: MessageData) => void): void;
}
```

**使用示例：**

```typescript
import { platform } from '@platform/index';

// 发送消息
const response = await platform.messaging.sendMessage({
  type: 'GET_DATA',
  payload: { id: '123' },
});

// 监听消息
const handleMessage = (message) => {
  console.log('Received message:', message);
};

platform.messaging.onMessage(handleMessage);

// 移除监听
platform.messaging.offMessage(handleMessage);
```

## 2. 核心服务 API

### 2.1 CoreService 类

核心业务逻辑服务，采用单例模式：

```typescript
interface PlatformInfo {
  name: string;
  version: string;
  appName: string;
  isDev: boolean;
  platformDetails: {
    os: string;
    arch: string;
    platform: string;
  };
  nativeHostConnected: boolean;
}

interface PluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  capabilities: string[];
  description?: string;
  [key: string]: unknown;
}

class CoreService {
  // 获取单例实例
  static getInstance(): CoreService;

  // 初始化服务
  async initialize(): Promise<void>;

  // 增加计数器
  async incrementCounter(): Promise<number>;

  // 减少计数器
  async decrementCounter(): Promise<number>;

  // 获取当前计数值
  getCounter(): number;

  // 获取平台信息
  getPlatformInfo(): PlatformInfo;

  // 发送测试消息
  async sendTestMessage(): Promise<unknown>;

  // 刷新插件列表
  async refreshPlugins(): Promise<PluginInfo[]>;

  // 获取所有插件
  getPlugins(): PluginInfo[];

  // 获取单个插件
  getPlugin(name: string): PluginInfo | undefined;

  // 启用插件
  async enablePlugin(name: string): Promise<boolean>;

  // 禁用插件
  async disablePlugin(name: string): Promise<boolean>;

  // 调用插件方法
  async callPlugin(name: string, method: string, args: Array<unknown>): Promise<unknown>;

  // 检查插件是否具有特定能力
  hasPluginCapability(pluginName: string, capability: string): boolean;

  // 获取具有特定能力的插件列表
  getPluginsWithCapability(capability: string): PluginInfo[];

  // 设置原生主机连接状态
  setNativeHostConnected(status: boolean): void;

  // 获取原生主机连接状态
  isNativeHostConnected(): boolean;
}
```

**使用示例：**

```typescript
import { CoreService } from '@core/index';

// 获取核心服务实例
const coreService = CoreService.getInstance();

// 初始化服务
await coreService.initialize();

// 使用计数器功能
const newValue = await coreService.incrementCounter();
console.log('Current counter:', newValue);

// 获取平台信息
const info = coreService.getPlatformInfo();
console.log('Platform info:', info);
console.log('Running on', info.platformDetails.os, info.platformDetails.arch);
console.log('Development mode:', info.isDev);

// 发送测试消息
const response = await coreService.sendTestMessage();
console.log('Message response:', response);

// 插件管理
const plugins = await coreService.refreshPlugins();
console.log(
  'Available plugins:',
  plugins.map((p) => p.name)
);

// 启用插件
await coreService.enablePlugin('hello_world');

// 调用插件方法
const result = await coreService.callPlugin('hello_world', 'sayHello', ['Web Helper']);
```

### 2.2 工具函数

```typescript
export interface AppInfo {
  name: string;
  version: string;
  description: string;
}

// 格式化数字
export function formatNumber(num: number): string;

// 获取应用信息
export function getAppInfo(): AppInfo;
```

**使用示例：**

```typescript
import { formatNumber, getAppInfo } from '@core/index';

// 格式化数字
const formatted = formatNumber(1234567); // "1,234,567"

// 获取应用信息
const appInfo = getAppInfo();
console.log('App name:', appInfo.name);
console.log('App version:', appInfo.version);
console.log('App description:', appInfo.description);
```

## 3. 平台检测与切换

通过`__TARGET__`环境变量自动选择正确的平台实现：

```typescript
import { __TARGET__, PLATFORM_TYPE, setPlatform, getPlatform } from '@platform/index';
import { webPlatform } from '@platform/web';
import { webextPlatform } from '@platform/webext';
import { electronPlatform } from '@platform/electron';

// 手动设置平台实现
setPlatform(webPlatform); // 或 webextPlatform, electronPlatform

// 获取当前平台
const platform = getPlatform();

// 判断当前平台
if (__TARGET__ === PLATFORM_TYPE.WEB) {
  // Web平台特定逻辑
} else if (__TARGET__ === PLATFORM_TYPE.ELECTRON) {
  // Electron平台特定逻辑
} else if (__TARGET__ === PLATFORM_TYPE.WEBEXT) {
  // 浏览器扩展特定逻辑
}
```

## 4. 插件系统 API

### 4.1 PlatformPluginManager 接口

提供插件管理功能：

```typescript
interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  [key: string]: unknown;
}

interface PlatformPluginManager {
  // 发现并加载插件
  discoverAndLoadPlugins(): Promise<void>;

  // 激活插件
  activatePlugin(pluginId: string): Promise<void>;

  // 停用插件
  deactivatePlugin(pluginId: string): Promise<void>;

  // 获取插件信息
  getPlugin(pluginId: string): Promise<{ metadata: PluginMetadata; exports: any } | null>;

  // 获取激活的插件列表
  getActivePlugins(): Promise<Array<{ id: string; metadata: PluginMetadata }>>;

  // 安装插件
  installPlugin(pluginData: Record<string, unknown>): Promise<boolean>;

  // 卸载插件
  uninstallPlugin(pluginId: string): Promise<boolean>;

  // 列出已安装插件
  listInstalledPlugins(): Promise<Array<{ id: string; metadata: PluginMetadata }>>;
}
```

**使用示例：**

```typescript
import { platform } from '@platform/index';

// 发现并加载插件
await platform.pluginManager.discoverAndLoadPlugins();

// 获取已安装插件列表
const plugins = await platform.pluginManager.listInstalledPlugins();
console.log(
  'Installed plugins:',
  plugins.map((p) => p.metadata.name)
);

// 激活插件
await platform.pluginManager.activatePlugin('hello_world');

// 获取激活的插件
const activePlugins = await platform.pluginManager.getActivePlugins();
```

## 5. 错误处理最佳实践

1. 使用try/catch包装异步操作
2. 记录错误日志
3. 提供友好的错误提示
4. 确保插件操作有适当的错误处理

```typescript
try {
  await platform.storage.set('key', value);
} catch (error) {
  console.error('Storage error:', error);
  // 提供用户反馈或降级策略
}

// 插件操作的错误处理
try {
  await coreService.callPlugin('pluginId', 'method', params);
} catch (error) {
  console.error('Plugin call failed:', error);
  // 处理插件调用失败
}
```

## 6. 性能优化建议

1. 批量存储操作
2. 缓存频繁访问的数据
3. 合理使用平台提供的异步API
4. 避免在主线程执行耗时操作
5. 插件加载时注意性能影响，避免阻塞主线程
6. 对于消息传递，使用批处理减少消息数量
