import { Platform } from '@platform/index';

// Web 平台实现
const webStorage: Platform['storage'] = {
  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

const webRuntime: Platform['runtime'] = {
  getURL(path: string): string {
    return path;
  },
  
  getManifest(): any {
    return {
      version: process.env.npm_package_version || '1.0.0',
      name: 'Web Helper',
      description: 'Web Platform Helper'
    };
  }
};

const webMessaging: Platform['messaging'] = {
  async sendMessage(message: any): Promise<any> {
    // Web 环境下的消息传递模拟
    return new Promise((resolve) => {
      // 模拟消息响应
      setTimeout(() => {
        resolve({ success: true, data: message });
      }, 100);
    });
  },
  
  onMessage(callback: (message: any) => void): void {
    // 简单的事件监听实现
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'platform-message') {
        callback(event.data.payload);
      }
    });
  },
  
  offMessage(callback: (message: any) => void): void {
    // 由于简单实现，这里不做实际移除
    console.log('Listener removed in web platform');
  },
}

export const webPlatform: Platform = {
  storage: webStorage,
  runtime: webRuntime,
  messaging: webMessaging,
  name: 'web',
  pluginManager: {
    async discoverAndLoadPlugins() {},
    async activatePlugin(pluginId: string) {},
    async deactivatePlugin(pluginId: string) {},
    async getPlugin(pluginId: string) { return null; },
    async getActivePlugins() { return []; },
    async installPlugin(pluginData: any) { return false; },
    async uninstallPlugin(pluginId: string) { return false; },
    async listInstalledPlugins() { return []; }
  }
};

export default webPlatform;