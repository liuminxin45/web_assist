import { Platform, PLATFORM_TYPE } from '@platform/index';

// Web 平台实现
const webStorage: Platform['storage'] = {
  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

const webRuntime: Platform['runtime'] = {
  getVersion(): string {
    return process.env.npm_package_version || '1.0.0';
  },
  
  getPlatformInfo(): { os: string; arch: string; platform: string } {
    const userAgent = navigator.userAgent;
    let os = 'unknown';
    
    if (userAgent.includes('Windows')) {
      os = 'windows';
    } else if (userAgent.includes('Mac OS')) {
      os = 'macos';
    } else if (userAgent.includes('Linux')) {
      os = 'linux';
    } else if (userAgent.includes('Android')) {
      os = 'android';
    } else if (userAgent.includes('iOS')) {
      os = 'ios';
    }
    
    return {
      os,
      arch: 'unknown',
      platform: 'web',
    };
  },
  
  isDevMode(): boolean {
    return process.env.NODE_ENV === 'development';
  },
};

const webMessaging: Platform['messaging'] = {
  async sendMessage(message: any): Promise<any> {
    // Web 环境下的消息传递模拟
    return new Promise((resolve) => {
      // 模拟消息响应
      setTimeout(() => {
        resolve({ success: true, data: message });
      }, 100);
    });
  },
  
  onMessage(callback: (message: any, sender: any) => void): void {
    // 简单的事件监听实现
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'platform-message') {
        callback(event.data.payload, { origin: event.origin });
      }
    });
  },
  
  removeListener(callback: (message: any, sender: any) => void): void {
    // 由于简单实现，这里不做实际移除
    console.log('Listener removed in web platform');
  },
};

export const webPlatform: Platform = {
  storage: webStorage,
  runtime: webRuntime,
  messaging: webMessaging,
  name: PLATFORM_TYPE.WEB,
};

export default webPlatform;