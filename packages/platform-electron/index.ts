import { Platform, PLATFORM_TYPE } from '@platform/index';
import { ipcRenderer } from 'electron';

// Electron 平台实现
const electronStorage: Platform['storage'] = {
  async set(key: string, value: any): Promise<void> {
    return ipcRenderer.invoke('storage-set', { key, value });
  },
  
  async get(key: string): Promise<any> {
    return ipcRenderer.invoke('storage-get', key);
  },
  
  async remove(key: string): Promise<void> {
    return ipcRenderer.invoke('storage-remove', key);
  },
};

const electronRuntime: Platform['runtime'] = {
  getVersion(): string {
    return ipcRenderer.invoke('get-version') || '1.0.0';
  },
  
  getPlatformInfo(): { os: string; arch: string; platform: string } {
    return ipcRenderer.invoke('get-platform-info');
  },
  
  isDevMode(): boolean {
    return ipcRenderer.invoke('is-dev-mode');
  },
};

const electronMessaging: Platform['messaging'] = {
  async sendMessage(message: any): Promise<any> {
    return ipcRenderer.invoke('message-send', message);
  },
  
  onMessage(callback: (message: any, sender: any) => void): void {
    ipcRenderer.on('message-receive', (event, message) => {
      callback(message, { type: 'electron' });
    });
  },
  
  removeListener(callback: (message: any, sender: any) => void): void {
    ipcRenderer.removeAllListeners('message-receive');
  },
};

export const electronPlatform: Platform = {
  storage: electronStorage,
  runtime: electronRuntime,
  messaging: electronMessaging,
  name: PLATFORM_TYPE.ELECTRON,
};

export default electronPlatform;