import { Platform, PLATFORM_TYPE } from '@platform/index';
import { webExtPluginManager } from './src/plugin/WebExtPluginManager';

// WebExtension 平台实现
const webextStorage: Platform['storage'] = {
  async set(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Chrome storage API not available'));
      }
    });
  },
  
  async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[key]);
          }
        });
      } else {
        reject(new Error('Chrome storage API not available'));
      }
    });
  },
  
  async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Chrome storage API not available'));
      }
    });
  },
};

const webextRuntime: Platform['runtime'] = {
  getVersion(): string {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return chrome.runtime.getManifest().version || '1.0.0';
    }
    return '1.0.0';
  },
  
  getPlatformInfo(): { os: string; arch: string; platform: string } {
    return {
      os: 'unknown',
      arch: 'unknown',
      platform: 'webext',
    };
  },
  
  isDevMode(): boolean {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return !chrome.runtime.id.includes('@');
    }
    return true;
  },
};

const webextMessaging: Platform['messaging'] = {
  async sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      } else {
        reject(new Error('Chrome runtime API not available'));
      }
    });
  },
  
  onMessage(callback: (message: any, sender: any) => void): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(callback);
    }
  },
  
  removeListener(callback: (message: any, sender: any) => void): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.removeListener(callback);
    }
  },
};

const webextPluginManager: Platform['pluginManager'] = {
  discoverAndLoadPlugins: () => webExtPluginManager.discoverAndLoadPlugins(),
  activatePlugin: (pluginId) => webExtPluginManager.activatePlugin(pluginId),
  deactivatePlugin: (pluginId) => webExtPluginManager.deactivatePlugin(pluginId),
  getPlugin: (pluginId) => webExtPluginManager.getPlugin(pluginId),
  getActivePlugins: () => webExtPluginManager.getActivePlugins(),
  installPlugin: (pluginData) => webExtPluginManager.installPlugin(pluginData),
  uninstallPlugin: (pluginId) => webExtPluginManager.uninstallPlugin(pluginId),
  listInstalledPlugins: async () => {
    // 转换格式以匹配接口要求
    const plugins = await webExtPluginManager.getLoadedPlugins();
    return plugins.map(plugin => ({
      id: plugin.id,
      metadata: plugin.metadata
    }));
  }
};

export const webextPlatform: Platform = {
  storage: webextStorage,
  runtime: webextRuntime,
  messaging: webextMessaging,
  pluginManager: webextPluginManager,
  name: PLATFORM_TYPE.WEBEXT,
};

export default webextPlatform;