import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// 定义API接口类型
interface PlatformInfo {
  os: NodeJS.Platform;
  arch: string;
  platform: string;
}

interface MessageData {
  type: string;
  payload?: unknown;
}

interface ElectronStorageAPI {
  set: (key: string, value: unknown) => Promise<void>;
  get: (key: string) => Promise<unknown>;
  remove: (key: string) => Promise<void>;
}

interface ElectronRuntimeAPI {
  getVersion: () => Promise<string>;
  getPlatformInfo: () => Promise<PlatformInfo>;
  isDevMode: () => Promise<boolean>;
}

interface MessageResponse {
  success: boolean;
  message: string;
  received: unknown;
  timestamp: number;
}

interface ElectronMessagingAPI {
  sendMessage: (message: MessageData) => Promise<MessageResponse>;
  onMessage: (callback: (message: MessageData) => void) => () => void;
}

interface ElectronAPI {
  storage: ElectronStorageAPI;
  runtime: ElectronRuntimeAPI;
  messaging: ElectronMessagingAPI;
}

// 安全地暴露 IPC 接口到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 存储相关 API
  storage: {
    set: (key, value) => ipcRenderer.invoke('storage-set', { key, value }),
    get: (key) => ipcRenderer.invoke('storage-get', key),
    remove: (key) => ipcRenderer.invoke('storage-remove', key),
  },

  // 运行时信息 API
  runtime: {
    getVersion: () => ipcRenderer.invoke('get-version'),
    getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),
    isDevMode: () => ipcRenderer.invoke('is-dev-mode'),
  },

  // 消息传递 API
  messaging: {
    sendMessage: (message: MessageData) => ipcRenderer.invoke('message-send', message),
    onMessage: (callback: (message: MessageData) => void) => {
      const handleMessage = (_event: IpcRendererEvent, message: MessageData) => callback(message);
      ipcRenderer.on('message-receive', handleMessage);
      return () => {
        ipcRenderer.removeListener('message-receive', handleMessage);
      };
    },
  },
} as ElectronAPI);

// 声明全局Target类型
declare global {
  interface Window {
    __TARGET__: string;
  }
}

// 安全设置目标环境变量
if (typeof window !== 'undefined') {
  window.__TARGET__ = 'electron';
}

// 同时设置process环境变量
process.env.__TARGET__ = 'electron';

console.log('Preload script loaded');

// 扩展全局Window接口以支持electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    __TARGET__: string;
  }
}
