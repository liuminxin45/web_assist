import { platform } from '@platform/index';
// 导入插件系统
export * from './src/plugin/types';
export { pluginManager, PluginManager } from './src/plugin/pluginManager';
export { pluginProcessManager, PluginProcessManager, PluginProcessType } from './src/plugin/pluginProcessManager';
// 导入IPC系统
export { ipcManager, IpcManager, IpcHandler, IpcMessageType } from './src/ipc/ipcManager';

// 定义插件类型
export interface PluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  capabilities: string[];
  [key: string]: any;
}

// 核心服务类
export class CoreService {
  private counter: number = 0;
  private static instance: CoreService;
  private plugins: PluginInfo[] = [];
  private nativeHostConnected: boolean = false;

  // 单例模式
  public static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  // 初始化核心服务
  async initialize(): Promise<void> {
    try {
      // 从存储中加载计数器值
      const savedCounter = await platform.storage.get('counter');
      if (savedCounter !== null) {
        this.counter = savedCounter;
      }
      console.log(`CoreService initialized on ${platform.name}`);
      
      // 尝试加载插件列表
      try {
        await this.refreshPlugins();
      } catch (error) {
        console.warn('Failed to load plugins during initialization:', error);
      }
    } catch (error) {
      console.error('Error initializing CoreService:', error);
    }
  }

  // 增加计数器
  async incrementCounter(): Promise<number> {
    this.counter++;
    await this.saveCounter();
    return this.counter;
  }

  // 减少计数器
  async decrementCounter(): Promise<number> {
    if (this.counter > 0) {
      this.counter--;
      await this.saveCounter();
    }
    return this.counter;
  }

  // 获取当前计数值
  getCounter(): number {
    return this.counter;
  }

  // 保存计数器到存储
  private async saveCounter(): Promise<void> {
    try {
      await platform.storage.set('counter', this.counter);
    } catch (error) {
      console.error('Error saving counter:', error);
    }
  }

  // 获取平台信息
  getPlatformInfo() {
    return {
      name: platform.name,
      version: platform.runtime.getVersion(),
      isDev: platform.runtime.isDevMode(),
      platformDetails: platform.runtime.getPlatformInfo(),
      nativeHostConnected: this.nativeHostConnected
    };
  }

  // 发送消息
  async sendTestMessage(): Promise<any> {
    try {
      const response = await platform.messaging.sendMessage({
        type: 'TEST_MESSAGE',
        payload: {
          timestamp: Date.now(),
          counter: this.counter,
        },
      });
      return response;
    } catch (error) {
      console.error('Error sending test message:', error);
      return { error: String(error) };
    }
  }

  // 插件管理相关功能
  
  // 刷新插件列表
  async refreshPlugins(): Promise<PluginInfo[]> {
    try {
      const response = await this.sendMessageToBackground({
        type: 'PLUGIN_LIST'
      });
      
      if (response.success) {
        this.plugins = response.data || [];
        this.nativeHostConnected = true;
        return this.plugins;
      } else {
        this.nativeHostConnected = false;
        console.error('Failed to refresh plugins:', response.error);
        return [];
      }
    } catch (error) {
      this.nativeHostConnected = false;
      console.error('Error refreshing plugins:', error);
      return [];
    }
  }

  // 获取插件列表
  getPlugins(): PluginInfo[] {
    return [...this.plugins];
  }

  // 获取单个插件信息
  getPlugin(name: string): PluginInfo | undefined {
    return this.plugins.find(plugin => plugin.name === name);
  }

  // 启用插件
  async enablePlugin(name: string): Promise<boolean> {
    try {
      const response = await this.sendMessageToBackground({
        type: 'PLUGIN_ENABLE',
        name
      });
      
      if (response.success) {
        await this.refreshPlugins();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling plugin:', error);
      return false;
    }
  }

  // 禁用插件
  async disablePlugin(name: string): Promise<boolean> {
    try {
      const response = await this.sendMessageToBackground({
        type: 'PLUGIN_DISABLE',
        name
      });
      
      if (response.success) {
        await this.refreshPlugins();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error disabling plugin:', error);
      return false;
    }
  }

  // 调用插件方法
  async callPlugin(name: string, method: string, args: any): Promise<any> {
    try {
      const response = await this.sendMessageToBackground({
        type: 'PLUGIN_CALL',
        name,
        method,
        args
      });
      
      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.error || 'Failed to call plugin');
      }
    } catch (error) {
      console.error(`Error calling plugin ${name}.${method}:`, error);
      throw error;
    }
  }

  // 检查插件是否具有某个能力
  hasPluginCapability(pluginName: string, capability: string): boolean {
    const plugin = this.getPlugin(pluginName);
    return plugin?.enabled && plugin.capabilities?.includes(capability) || false;
  }

  // 获取支持特定能力的插件列表
  getPluginsWithCapability(capability: string): PluginInfo[] {
    return this.plugins.filter(plugin => 
      plugin.enabled && plugin.capabilities?.includes(capability)
    );
  }

  // 向后台脚本发送消息
  private async sendMessageToBackground(message: any): Promise<any> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(message, resolve);
      } else {
        resolve({ success: false, error: 'chrome.runtime not available' });
      }
    });
  }

  // 设置Native Host连接状态
  setNativeHostConnected(status: boolean): void {
    this.nativeHostConnected = status;
  }

  // 检查Native Host连接状态
  isNativeHostConnected(): boolean {
    return this.nativeHostConnected;
  }
}

// 导出工具函数
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function getAppInfo() {
  return {
    name: 'Web Helper',
    version: '1.0.0',
    description: 'Multi-platform minimal skeleton application with plugin support',
  };
}