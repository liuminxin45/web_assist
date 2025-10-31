const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 创建存储目录
const getUserDataPath = () => {
  return app.getPath('userData');
};

const getStorageFilePath = () => {
  const dataPath = getUserDataPath();
  const storageDir = path.join(dataPath, 'storage');
  
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  return path.join(storageDir, 'app-data.json');
};

// 简易文件存储实现
const storage = {
  data: {},
  
  load() {
    try {
      const filePath = getStorageFilePath();
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.data = JSON.parse(data);
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
  
  set(key, value) {
    this.data[key] = value;
    this.save();
  },
  
  get(key) {
    return this.data[key] !== undefined ? this.data[key] : null;
  },
  
  remove(key) {
    delete this.data[key];
    this.save();
  }
};

// 注册 IPC 处理函数
const registerIpcHandlers = () => {
  // 存储相关 IPC
  ipcMain.handle('storage-set', (event, { key, value }) => {
    storage.set(key, value);
  });
  
  ipcMain.handle('storage-get', (event, key) => {
    return storage.get(key);
  });
  
  ipcMain.handle('storage-remove', (event, key) => {
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
  ipcMain.handle('message-send', (event, message) => {
    console.log('Main process received message:', message);
    // 模拟消息处理
    return {
      success: true,
      message: 'Message processed by Electron main process',
      received: message,
      timestamp: Date.now()
    };
  });
  
  // 向渲染进程发送消息的示例
  ipcMain.on('message-broadcast', (event, message) => {
    // 广播到所有窗口
    BrowserWindow.getAllWindows().forEach(window => {
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
  mainWindow.loadURL('http://localhost:5173');

  // 开发环境下打开调试工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// 应用生命周期事件
app.whenReady().then(() => {
  // 加载存储数据
  storage.load();
  
  // 注册 IPC 处理函数
  registerIpcHandlers();
  
  // 创建窗口
  createWindow();
  
  // macOS 特有的行为
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 关闭应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

console.log('Electron main process started');