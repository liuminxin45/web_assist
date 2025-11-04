import { Platform, PLATFORM_TYPE } from '../platform';

// Chrome扩展API类型声明
interface ChromeStorage {
  local: {
    set(items: Record<string, unknown>, callback?: () => void): void;
    get(keys: string[], callback: (items: Record<string, unknown>) => void): void;
    remove(keys: string[], callback?: () => void): void;
  };
}

interface ChromeRuntime {
  lastError?: Error;
  sendMessage(message: Record<string, unknown>, callback?: (response?: unknown) => void): void;
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void
      ) => boolean | undefined
    ): void;
    removeListener(
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response?: unknown) => void
      ) => boolean | undefined
    ): void;
  };
  getURL(path: string): string;
  getManifest(): Record<string, unknown>;
}

interface Chrome {
  storage?: ChromeStorage;
  runtime?: ChromeRuntime;
}

declare const chrome: Chrome | undefined;

// WebExtension 平台实现
const webextStorage: Platform['storage'] = {
  async set<T = unknown>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime?.lastError) {
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

  async get<T = unknown>(key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[key] as T | undefined);
          }
        });
      } else {
        reject(new Error('Chrome storage API not available'));
      }
    });
  },

  async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime?.lastError) {
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
  getURL(path: string): string {
    if (chrome && chrome.runtime) {
      return chrome.runtime.getURL(path);
    }
    return path;
  },

  getManifest(): Record<string, unknown> {
    if (chrome && chrome.runtime) {
      return chrome.runtime.getManifest();
    }
    return {};
  },
};

const webextMessaging: Platform['messaging'] = {
  async sendMessage<T = unknown>(message: Record<string, unknown>): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response as T | undefined);
          }
        });
      } else {
        reject(new Error('Chrome runtime API not available'));
      }
    });
  },

  onMessage(callback: (message: Record<string, unknown>) => void): void {
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      const listener = (message: unknown): boolean | undefined => {
        callback(message as Record<string, unknown>);
        return false;
      };
      chrome.runtime.onMessage.addListener(listener);
    }
  },

  offMessage(_callback: (message: Record<string, unknown>) => void): void {
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      // 注意：这里简化了实现，实际应该移除特定的监听器
      // chrome.runtime.onMessage.removeListener(listener);
    }
  },
};

const webextPluginManager: Platform['pluginManager'] = {
  discoverAndLoadPlugins: (): Promise<void> => {
    return Promise.resolve();
  },

  activatePlugin: (_pluginId: string): Promise<void> => {
    return Promise.resolve();
  },

  deactivatePlugin: (_pluginId: string): Promise<void> => {
    return Promise.resolve();
  },

  getPlugin: (
    _pluginId: string
  ): Promise<{ metadata: Record<string, unknown>; exports: Record<string, unknown> } | null> => {
    return Promise.resolve(null);
  },

  getActivePlugins: (): Promise<Array<{ id: string; metadata: Record<string, unknown> }>> => {
    return Promise.resolve([]);
  },

  installPlugin: (_pluginData: Record<string, unknown>): Promise<boolean> => {
    return Promise.resolve(false);
  },

  uninstallPlugin: (_pluginId: string): Promise<boolean> => {
    return Promise.resolve(false);
  },

  listInstalledPlugins: (): Promise<Array<{ id: string; metadata: Record<string, unknown> }>> => {
    return Promise.resolve([]);
  },
};

export const webextPlatform: Platform = {
  storage: webextStorage,
  runtime: webextRuntime,
  messaging: webextMessaging,
  pluginManager: webextPluginManager,
  name: PLATFORM_TYPE.WEBEXT,
};

export default webextPlatform;
