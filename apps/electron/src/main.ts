import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 创建存储目录
const getUserDataPath = (): string => {
  return app.getPath('userData');
};

const getStorageFilePath = (): string => {
  const dataPath = getUserDataPath();
  const storageDir = path.join(dataPath, 'storage');

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  return path.join(storageDir, 'app-data.json');
};

// 简易文件存储实现
interface StorageData {
  [key: string]: unknown;
}

const storage: {
  data: StorageData;
  load: () => void;
  save: () => void;
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
  remove: (key: string) => void;
} = {
  data: {},

  load() {
    try {
      const filePath = getStorageFilePath();
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.data = JSON.parse(data) as StorageData;
      }
    } catch (error) {
      console.error('Failed to load storage:', error);
    }
  },

  save() {
    try {
      const filePath = getStorageFilePath();
      fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save storage:', error);
    }
  },

  set(key: string, value: unknown) {
    this.data[key] = value;
    this.save();
  },

  get(key: string): unknown {
    return this.data[key] !== undefined ? this.data[key] : null;
  },

  remove(key: string) {
    delete this.data[key];
    this.save();
  },
};

// 注册 IPC 处理函数
const registerIpcHandlers = () => {
  // 存储相关 IPC
  ipcMain.handle(
    'storage-set',
    (event: IpcMainInvokeEvent, { key, value }: { key: string; value: unknown }) => {
      storage.set(key, value);
    }
  );

  ipcMain.handle('storage-get', (event: IpcMainInvokeEvent, key: string) => {
    return storage.get(key);
  });

  ipcMain.handle('storage-remove', (event: IpcMainInvokeEvent, key: string) => {
    storage.remove(key);
  });

  // 运行时信息 IPC
  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-platform-info', () => {
    return {
      os: process.platform,
      arch: process.arch,
      platform: 'electron',
    };
  });

  ipcMain.handle('is-dev-mode', () => {
    return process.env.NODE_ENV === 'development';
  });

  // 消息传递 IPC
  ipcMain.handle('message-send', (event: IpcMainInvokeEvent, message: unknown) => {
    console.log('Main process received message:', message);
    // 模拟消息处理
    return {
      success: true,
      message: 'Message processed by Electron main process',
      received: message,
      timestamp: Date.now(),
    };
  });

  // 向渲染进程发送消息的示例
  ipcMain.on('message-broadcast', (event: IpcMainEvent, message: unknown) => {
    // 广播到所有窗口
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('message-receive', message);
    });
  });
};

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加载 Web 应用（在实际开发中，可以指向本地的 Web 服务器）
  void mainWindow.loadURL('https://www.baidu.com');

  // 开发环境下打开调试工具
  if (process.env.NODE_ENV === 'development') {
    void mainWindow.webContents.openDevTools();
  }
}

// 应用生命周期事件
void app.whenReady().then(() => {
  // 加载存储数据
  storage.load();

  // 注册 IPC 处理函数
  registerIpcHandlers();

  // 创建窗口
  createWindow();

  // macOS 特有的行为
  void app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 关闭应用
void app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

console.log('Electron main process started');
