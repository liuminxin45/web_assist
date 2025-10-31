# API 文档

本文档详细介绍Web Helper多平台项目的核心API接口。

## 1. 平台抽象层 API

### 1.1 Platform 接口

```typescript
interface Platform {
  storage: PlatformStorage;
  runtime: PlatformRuntime;
  messaging: PlatformMessaging;
  name: 'web' | 'electron' | 'webext';
}
```

### 1.2 PlatformStorage 接口

提供统一的存储能力：

```typescript
interface PlatformStorage {
  // 设置存储项
  set(key: string, value: any): Promise<void>;
  
  // 获取存储项
  get(key: string): Promise<any>;
  
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

提供运行时信息和环境检测：

```typescript
interface PlatformRuntime {
  // 获取应用版本
  getVersion(): string;
  
  // 获取平台信息
  getPlatformInfo(): { os: string; arch: string; platform: string };
  
  // 检测是否为开发模式
  isDevMode(): boolean;
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
interface PlatformMessaging {
  // 发送消息
  sendMessage(message: any): Promise<any>;
  
  // 监听消息
  onMessage(callback: (message: any, sender: any) => void): void;
  
  // 移除消息监听
  removeListener(callback: (message: any, sender: any) => void): void;
}
```

**使用示例：**

```typescript
import { platform } from '@platform/index';

// 发送消息
const response = await platform.messaging.sendMessage({
  type: 'GET_DATA',
  payload: { id: '123' }
});

// 监听消息
const handleMessage = (message, sender) => {
  console.log('Received message:', message, 'from:', sender);
};

platform.messaging.onMessage(handleMessage);

// 移除监听
// platform.messaging.removeListener(handleMessage);
```

## 2. 核心服务 API

### 2.1 CoreService 类

核心业务逻辑服务，采用单例模式：

```typescript
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
  getPlatformInfo();
  
  // 发送测试消息
  async sendTestMessage(): Promise<any>;
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

// 发送测试消息
const response = await coreService.sendTestMessage();
console.log('Message response:', response);
```

### 2.2 工具函数

```typescript
// 格式化数字
export function formatNumber(num: number): string;

// 获取应用信息
export function getAppInfo();
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
```

## 3. 平台检测与切换

通过`__TARGET__`环境变量自动选择正确的平台实现：

```typescript
import { __TARGET__, PLATFORM_TYPE } from '@platform/index';

// 判断当前平台
if (__TARGET__ === PLATFORM_TYPE.WEB) {
  // Web平台特定逻辑
} else if (__TARGET__ === PLATFORM_TYPE.ELECTRON) {
  // Electron平台特定逻辑
} else if (__TARGET__ === PLATFORM_TYPE.WEBEXT) {
  // 浏览器扩展特定逻辑
}
```

## 4. 错误处理最佳实践

1. 使用try/catch包装异步操作
2. 记录错误日志
3. 提供友好的错误提示

```typescript
try {
  await platform.storage.set('key', value);
} catch (error) {
  console.error('Storage error:', error);
  // 提供用户反馈或降级策略
}
```

## 5. 性能优化建议

1. 批量存储操作
2. 缓存频繁访问的数据
3. 合理使用平台提供的异步API
4. 避免在主线程执行耗时操作