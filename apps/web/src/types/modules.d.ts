// Type declarations for monorepo packages
declare module '@core/index' {
  export interface AppInfo {
    name: string;
    description: string;
    version: string;
  }

  export interface PlatformInfo {
    type: string;
    version: string;
    features?: Record<string, unknown>;
  }

  export interface MessageResponse {
    status: string;
    data?: unknown;
  }

  export class CoreService {
    constructor();
    static getInstance(): CoreService;
    getCounter(): number;
    getPlatformInfo(): PlatformInfo;
    incrementCounter(): Promise<void>;
    decrementCounter(): Promise<void>;
    sendTestMessage(): Promise<MessageResponse>;
    initialize(): Promise<void>;
  }

  export function getAppInfo(): AppInfo;
}

declare module '@platform/index' {
  export interface Platform {
    name: string;
    version: string;
    // 添加更多平台接口属性
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
