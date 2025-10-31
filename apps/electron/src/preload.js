const { contextBridge, ipcRenderer } = require('electron');

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
    sendMessage: (message) => ipcRenderer.invoke('message-send', message),
    onMessage: (callback) => {
      const handleMessage = (event, ...args) => callback(...args);
      ipcRenderer.on('message-receive', handleMessage);
      return () => {
        ipcRenderer.removeListener('message-receive', handleMessage);
      };
    },
  },
});

// 设置目标环境变量
globalThis.__TARGET__ = 'electron';
process.env.__TARGET__ = 'electron';

console.log('Preload script loaded');