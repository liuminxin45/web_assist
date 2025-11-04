import { Platform, PLATFORM_TYPE } from '../platform';
import { ipcRenderer } from 'electron';

// Electron 平台实现
const electronStorage: Platform['storage'] = {
  async set<T = unknown>(key: string, value: T): Promise<void> {
    await ipcRenderer.invoke('storage-set', { key, value });
  },

  async get<T = unknown>(key: string): Promise<T | undefined> {
    return ipcRenderer.invoke('storage-get', key) as Promise<T | undefined>;
  },

  async remove(key: string): Promise<void> {
    await ipcRenderer.invoke('storage-remove', key);
  },
};

const electronRuntime: Platform['runtime'] = {
  getURL(path: string): string {
    return path; // Electron 环境下直接返回路径
  },

  getManifest(): Record<string, unknown> {
    return {}; // 返回空对象作为默认值
  },
};

const electronMessaging: Platform['messaging'] = {
  async sendMessage<T = unknown>(message: Record<string, unknown>): Promise<T | undefined> {
    return ipcRenderer.invoke('message-send', message) as Promise<T | undefined>;
  },

  onMessage(callback: (message: Record<string, unknown>) => void): void {
    ipcRenderer.on('message-receive', (event, message: Record<string, unknown>) => {
      callback(message);
    });
  },

  offMessage(_callback: (message: Record<string, unknown>) => void): void {
    ipcRenderer.removeAllListeners('message-receive');
  },
};

// 插件管理器实现（基础版本）
const electronPluginManager: Platform['pluginManager'] = {
  discoverAndLoadPlugins(): Promise<void> {
    return Promise.resolve(); // 实现插件发现和加载逻辑
  },

  activatePlugin(_pluginId: string): Promise<void> {
    return Promise.resolve(); // 实现激活插件逻辑
  },

  deactivatePlugin(_pluginId: string): Promise<void> {
    return Promise.resolve(); // 实现停用插件逻辑
  },

  getPlugin(
    _pluginId: string
  ): Promise<{ metadata: Record<string, unknown>; exports: Record<string, unknown> } | null> {
    return Promise.resolve(null);
  },

  getActivePlugins(): Promise<Array<{ id: string; metadata: Record<string, unknown> }>> {
    return Promise.resolve([]);
  },

  installPlugin(_pluginData: Record<string, unknown>): Promise<boolean> {
    return Promise.resolve(false);
  },

  uninstallPlugin(_pluginId: string): Promise<boolean> {
    return Promise.resolve(false);
  },

  listInstalledPlugins(): Promise<Array<{ id: string; metadata: Record<string, unknown> }>> {
    return Promise.resolve([]);
  },
};

export const electronPlatform: Platform = {
  storage: electronStorage,
  runtime: electronRuntime,
  messaging: electronMessaging,
  pluginManager: electronPluginManager,
  name: PLATFORM_TYPE.ELECTRON,
};

export default electronPlatform;
