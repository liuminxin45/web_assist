// Type declarations for monorepo packages
declare module '@core/index' {
  export class CoreService {
    constructor();
    static getInstance(): CoreService;
    getCounter(): number;
    getPlatformInfo(): any;
    incrementCounter(): Promise<void>;
    decrementCounter(): Promise<void>;
    sendTestMessage(): Promise<any>;
    initialize(): Promise<void>;
  }
  export function getAppInfo(): any;
}

declare module '@platform/index' {
  export function setPlatform(platform: any): void;
}

declare module '@platform/web' {
  export const webPlatform: any;
}

declare module '@core/*';
declare module '@platform/*';
declare module '@platform/web/*';