// Type declarations for monorepo packages
declare module '@core/index' {
  export interface AppInfo {
    name: string;
    description: string;
    version: string;
  }

  export interface PlatformInfo {
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

  export interface MessageResponse {
    success: boolean;
    data?: unknown;
    result?: unknown;
    error?: Error | string;
  }

  export class CoreService {
    constructor();
    static getInstance(): CoreService;
    getCounter(): number;
    getPlatformInfo(): PlatformInfo;
    incrementCounter(): Promise<number>;
    decrementCounter(): Promise<number>;
    sendTestMessage(): Promise<unknown>;
    initialize(): Promise<void>;
  }

  export function getAppInfo(): AppInfo;
}

declare module '@platform/index' {
  export interface PlatformStorage {
    get<T = unknown>(key: string): Promise<T | undefined>;
    set<T = unknown>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
  }

  export interface PlatformRuntime {
    getURL(path: string): string;
    getManifest(): Record<string, unknown>;
  }

  export interface PlatformMessaging {
    sendMessage<T = unknown>(message: Record<string, unknown>): Promise<T | undefined>;
    onMessage(callback: (message: Record<string, unknown>) => void): void;
    offMessage(callback: (message: Record<string, unknown>) => void): void;
  }

  export interface PlatformPluginManager {
    discoverAndLoadPlugins(): Promise<void>;
    activatePlugin(pluginId: string): Promise<void>;
    deactivatePlugin(pluginId: string): Promise<void>;
    getPlugin(pluginId: string): Promise<{ metadata: any; exports: any } | null>;
    getActivePlugins(): Promise<Array<{ id: string; metadata: any }>>;
    installPlugin(pluginData: Record<string, unknown>): Promise<boolean>;
    uninstallPlugin(pluginId: string): Promise<boolean>;
    listInstalledPlugins(): Promise<Array<{ id: string; metadata: any }>>;
  }

  export interface Platform {
    storage: PlatformStorage;
    runtime: PlatformRuntime;
    messaging: PlatformMessaging;
    pluginManager: PlatformPluginManager;
    name: 'web' | 'electron' | 'webext';
  }

  export function setPlatform(platform: Platform): void;
}

declare module '@platform/web' {
  import { Platform } from '@platform/index';
  export const webPlatform: Platform;
}

declare module '@core/*';
declare module '@platform/*';
declare module '@platform/web/*';
// 声明其他可能的子模块
