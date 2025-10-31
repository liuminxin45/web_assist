// 平台抽象接口定义
export interface PlatformStorage {
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  remove(key: string): Promise<void>;
}

export interface PlatformRuntime {
  getVersion(): string;
  getPlatformInfo(): { os: string; arch: string; platform: string };
  isDevMode(): boolean;
}

export interface PlatformMessaging {
  sendMessage(message: any): Promise<any>;
  onMessage(callback: (message: any, sender: any) => void): void;
  removeListener(callback: (message: any, sender: any) => void): void;
}

export interface Platform {
  storage: PlatformStorage;
  runtime: PlatformRuntime;
  messaging: PlatformMessaging;
  name: 'web' | 'electron' | 'webext';
}

// 导出默认的平台接口，将由具体实现覆盖
export let platform: Platform;

// 设置平台实现的函数
export const setPlatform = (p: Platform) => {
  platform = p;
};

// 导出平台类型常量
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
}

export const __TARGET__ = (typeof window !== 'undefined' && window.__TARGET__) || 
  (typeof process !== 'undefined' && process.env.__TARGET__) || 
  'web';