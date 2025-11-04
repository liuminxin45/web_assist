import { Platform } from '../platform/index';

/**
 * 模拟的存储实现
 */
class MockStorage {
  private store: Record<string, any> = {};

  async set(key: string, value: any): Promise<void> {
    this.store[key] = value;
  }

  async get(key: string): Promise<any> {
    return this.store[key] ?? null;
  }

  async remove(key: string): Promise<void> {
    delete this.store[key];
  }

  // 清除所有存储数据，用于测试重置
  clear(): void {
    this.store = {};
  }

  // 获取所有存储数据，用于测试验证
  getAll(): Record<string, any> {
    return { ...this.store };
  }
}

/**
 * 模拟的运行时实现
 */
class MockRuntime {
  private version: string;
  private isDev: boolean;
  private platformInfo: { os: string; arch: string; platform: string };

  constructor(version = '1.0.0', isDev = true, platformInfo = { os: 'test', arch: 'x64', platform: 'mock' }) {
    this.version = version;
    this.isDev = isDev;
    this.platformInfo = platformInfo;
  }

  getVersion(): string {
    return this.version;
  }

  getPlatformInfo(): { os: string; arch: string; platform: string } {
    return { ...this.platformInfo };
  }

  isDevMode(): boolean {
    return this.isDev;
  }

  // 实现PlatformRuntime接口所需的方法
  getURL(path: string): string {
    return `https://mock-extension.test/${path}`;
  }

  getManifest(): any {
    return {
      name: 'Mock Extension',
      version: this.version,
      manifest_version: 3
    };
  }

  // 设置运行时属性，用于测试
  setVersion(version: string): void {
    this.version = version;
  }

  setDevMode(isDev: boolean): void {
    this.isDev = isDev;
  }

  setPlatformInfo(platformInfo: { os: string; arch: string; platform: string }): void {
    this.platformInfo = platformInfo;
  }
}

/**
 * 模拟的消息传递实现
 */
class MockMessaging {
  private messageHandlers: ((message: any) => void)[] = [];
  private messageQueue: any[] = [];

  async sendMessage(message: any): Promise<any> {
    this.messageQueue.push(message);
    
    // 模拟消息响应
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: message,
          platform: 'mock',
          timestamp: Date.now()
        });
      }, 0);
    });
  }

  onMessage(callback: (message: any) => void): void {
    this.messageHandlers.push(callback);
  }

  // 实现PlatformMessaging接口所需的offMessage方法
  offMessage(callback: (message: any) => void): void {
    const index = this.messageHandlers.indexOf(callback);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  // 触发模拟消息，用于测试消息处理器
  emitMessage(message: any, sender: any = {}): void {
    // 忽略sender参数，只传递message
    this.messageHandlers.forEach(handler => handler(message));
  }

  // 获取发送过的消息队列，用于测试验证
  getSentMessages(): any[] {
    return [...this.messageQueue];
  }

  // 清除消息队列，用于测试重置
  clearSentMessages(): void {
    this.messageQueue = [];
  }
}

/**
 * 模拟的插件管理器实现
 */
class MockPluginManager {
  private plugins: Map<string, { metadata: any; exports: any }> = new Map();
  private activePlugins: Set<string> = new Set();

  async discoverAndLoadPlugins(): Promise<void> {
    // 模拟发现和加载插件
  }

  async activatePlugin(pluginId: string): Promise<void> {
    this.activePlugins.add(pluginId);
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    this.activePlugins.delete(pluginId);
  }

  async getPlugin(pluginId: string): Promise<{ metadata: any; exports: any } | null> {
    return this.plugins.get(pluginId) || null;
  }

  async getActivePlugins(): Promise<Array<{ id: string; metadata: any }>> {
    const result: Array<{ id: string; metadata: any }> = [];
    for (const pluginId of this.activePlugins) {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        result.push({ id: pluginId, metadata: plugin.metadata });
      }
    }
    return result;
  }

  async installPlugin(pluginData: any): Promise<boolean> {
    const { id, metadata, exports } = pluginData;
    this.plugins.set(id, { metadata, exports });
    return true;
  }

  async uninstallPlugin(pluginId: string): Promise<boolean> {
    return this.plugins.delete(pluginId);
  }

  async listInstalledPlugins(): Promise<Array<{ id: string; metadata: any }>> {
    const result: Array<{ id: string; metadata: any }> = [];
    for (const [id, plugin] of this.plugins.entries()) {
      result.push({ id, metadata: plugin.metadata });
    }
    return result;
  }

  // 添加插件，用于测试
  addPlugin(pluginId: string, metadata: any, exports: any): void {
    this.plugins.set(pluginId, { metadata, exports });
  }

  // 清除所有插件，用于测试重置
  clearPlugins(): void {
    this.plugins.clear();
    this.activePlugins.clear();
  }
}

/**
 * 创建模拟平台实例
 */
export function createMockPlatform(name: 'web' | 'electron' | 'webext' = 'web'): {
  platform: Platform;
  mockStorage: MockStorage;
  mockRuntime: MockRuntime;
  mockMessaging: MockMessaging;
  mockPluginManager: MockPluginManager;
} {
  const mockStorage = new MockStorage();
  const mockRuntime = new MockRuntime();
  const mockMessaging = new MockMessaging();
  const mockPluginManager = new MockPluginManager();

  const platform: Platform = {
    name,
    storage: mockStorage,
    runtime: mockRuntime,
    messaging: mockMessaging,
    pluginManager: mockPluginManager
  };

  return {
    platform,
    mockStorage,
    mockRuntime,
    mockMessaging,
    mockPluginManager
  };
}

/**
 * 创建特定平台的模拟实现
 */
export function createWebMockPlatform() {
  return createMockPlatform('web');
}

export function createElectronMockPlatform() {
  const { platform, mockRuntime, mockStorage, mockMessaging } = createMockPlatform('electron');
  mockRuntime.setPlatformInfo({ os: 'win32', arch: 'x64', platform: 'electron' });
  return { platform, mockRuntime, mockStorage, mockMessaging };
}

export function createWebextMockPlatform() {
  const { platform, mockRuntime, mockStorage, mockMessaging, mockPluginManager } = createMockPlatform('webext');
  mockRuntime.setPlatformInfo({ os: 'chrome', arch: 'x86_64', platform: 'webextension' });
  return { platform, mockRuntime, mockStorage, mockMessaging, mockPluginManager };
}

/**
 * 测试辅助函数：等待一定时间
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测试辅助函数：模拟异步错误
 */
export function simulateAsyncError<T>(error: Error): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), 0);
  });
}