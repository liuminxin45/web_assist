// 已在本地定义相关接口，无需从core包导入

// 插件元数据接口
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  [key: string]: unknown;
}

// 插件API类型
export type PluginAPI = Record<string, unknown>;

// 日志级别类型
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// 日志参数类型
export type LogParams = Array<unknown>;

// 日志记录器接口
export interface Logger {
  info: (...args: LogParams) => void;
  warn: (...args: LogParams) => void;
  error: (...args: LogParams) => void;
  debug: (...args: LogParams) => void;
}

// 插件上下文接口
export interface PluginContext {
  api: PluginAPI;
  logger: Logger;
  [key: string]: unknown;
}

// 插件激活函数类型
export type PluginActivateFunction = (context: PluginContext) => Promise<void>;

// 插件停用函数类型
export type PluginDeactivateFunction = () => Promise<void>;

// 插件导出接口
export interface PluginExports {
  activate: PluginActivateFunction;
  deactivate?: PluginDeactivateFunction;
  [key: string]: unknown;
}

// 平台存储接口
export interface PlatformStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

// 平台运行时接口
export interface PlatformRuntime {
  getURL(path: string): string;
  getManifest(): Record<string, unknown>;
}

// 消息类型
export type MessageData = Record<string, unknown>;

// 平台消息传递接口
export interface PlatformMessaging {
  sendMessage<T = unknown>(message: MessageData): Promise<T | undefined>;
  onMessage(callback: (message: MessageData) => void): void;
  offMessage(callback: (message: MessageData) => void): void;
}

// 插件数据类型
export type PluginData = Record<string, unknown>;

// 平台插件管理器接口
export interface PlatformPluginManager {
  // 核心插件管理方法
  discoverAndLoadPlugins(): Promise<void>;
  activatePlugin(pluginId: string): Promise<void>;
  deactivatePlugin(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): Promise<{ metadata: PluginMetadata; exports: PluginExports } | null>;
  getActivePlugins(): Promise<Array<{ id: string; metadata: PluginMetadata }>>;

  // 插件安装/卸载方法
  installPlugin(pluginData: PluginData): Promise<boolean>;
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
  WEBEXT: 'webext' as const,
};

// 导出环境变量类型定义（将在构建时注入）
declare global {
  interface Window {
    __TARGET__?: string;
  }

  interface Process {
    env?: Record<string, string | undefined>;
  }
}

// 定义全局对象类型
interface GlobalWithProcess {
  process?: Process;
  __TARGET__?: string;
}

// 获取全局对象（兼容浏览器和Node.js环境）
function getGlobal(): Window | GlobalWithProcess | undefined {
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global as GlobalWithProcess;
  }
  return undefined;
}

const globalObj = getGlobal();

// 安全地获取目标平台
export const __TARGET__ =
  (typeof window !== 'undefined' && window.__TARGET__) ||
  (typeof process !== 'undefined' && process.env?.__TARGET__) ||
  (globalObj && 'process' in globalObj && globalObj.process?.env?.__TARGET__) ||
  'web';
