import { PluginMetadata, PluginExports } from '@core/index';

// 平台存储接口
export interface PlatformStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
}

// 平台运行时接口
export interface PlatformRuntime {
  getURL(path: string): string;
  getManifest(): any;
}

// 平台消息传递接口
export interface PlatformMessaging {
  sendMessage(message: any): Promise<any>;
  onMessage(callback: (message: any) => void): void;
  offMessage(callback: (message: any) => void): void;
}

// 平台插件管理器接口
export interface PlatformPluginManager {
  // 核心插件管理方法
  discoverAndLoadPlugins(): Promise<void>;
  activatePlugin(pluginId: string): Promise<void>;
  deactivatePlugin(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): Promise<{ metadata: PluginMetadata; exports: PluginExports } | null>;
  getActivePlugins(): Promise<Array<{ id: string; metadata: PluginMetadata }>>;
  
  // 插件安装/卸载方法
  installPlugin(pluginData: any): Promise<boolean>;
  uninstallPlugin(pluginId: string): Promise<boolean>;
  
  // 插件信息查询
  listInstalledPlugins(): Promise<Array<{ id: string; metadata: PluginMetadata }>>;
}

// 主平台接口
export interface Platform {
  storage: PlatformStorage;
  runtime: PlatformRuntime;
  messaging: PlatformMessaging;
  pluginManager: PlatformPluginManager;
  name: 'web' | 'electron' | 'webext';
}

// 当前平台实例
let currentPlatform: Platform | null = null;

// 设置平台实现
export function setPlatform(platform: Platform): void {
  currentPlatform = platform;
}

// 获取平台实现
export function getPlatform(): Platform {
  if (!currentPlatform) {
    throw new Error('No platform has been set');
  }
  return currentPlatform;
}

// 导出默认的平台接口，将由具体实现覆盖
export let platform: Platform;

// 平台类型常量
export const PLATFORM_TYPE = {
  WEB: 'web' as const,
  ELECTRON: 'electron' as const,
  WEBEXT: 'webext' as const
};

// 导出环境变量类型定义（将在构建时注入）
declare global {
  interface Window {
    __TARGET__?: string;
  }
}

export const __TARGET__ = (typeof window !== 'undefined' && window.__TARGET__) || 
  (typeof process !== 'undefined' && process.env.__TARGET__) || 
  'web';