import { setPlatform } from '@platform/index';
import { webextPlatform } from '@platform/webext';
import { CoreService } from '@core/index';

// 设置 WebExtension 平台实现
setPlatform(webextPlatform);

// 初始化核心服务
let coreService: CoreService | null = null;

// Native Messaging Port
let nativePort: chrome.runtime.Port | null = null;
// 等待的RPC请求
const pendingRPCRequests = new Map<string, (response: any) => void>();
// UI连接端口列表
const uiPorts = new Map<string, chrome.runtime.Port>();

// 确保与Native Host的连接
function ensureNativePort() {
  if (!nativePort) {
    try {
      nativePort = chrome.runtime.connectNative('com.tp.plugins');
      nativePort.onMessage.addListener(onNativeMessage);
      nativePort.onDisconnect.addListener(() => {
        console.log('Native port disconnected');
        nativePort = null;
        // 通知所有UI连接
        broadcastToUIs({
          type: 'NATIVE_HOST_DISCONNECTED'
        });
      });
      console.log('Connected to native messaging host');
    } catch (error) {
      console.error('Failed to connect to native messaging host:', error);
    }
  }
  return nativePort;
}

// 处理来自Native Host的消息
function onNativeMessage(message: any) {
  console.log('Received message from native host:', message);
  
  // 处理RPC响应
  if (message.id && pendingRPCRequests.has(message.id)) {
    const resolver = pendingRPCRequests.get(message.id);
    pendingRPCRequests.delete(message.id);
    if (resolver) {
      resolver(message);
    }
  } 
  // 处理广播消息
  else if (message.type === 'BROADCAST') {
    broadcastToUIs(message);
  }
}

// 发送RPC请求到Native Host
function sendRPC(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const port = ensureNativePort();
    if (!port) {
      reject(new Error('Failed to connect to native messaging host'));
      return;
    }
    
    const id = crypto.randomUUID();
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    pendingRPCRequests.set(id, resolve);
    
    try {
      port.postMessage(request);
    } catch (error) {
      pendingRPCRequests.delete(id);
      reject(error);
    }
  });
}

// 广播消息到所有UI连接
function broadcastToUIs(message: any) {
  uiPorts.forEach(port => {
    try {
      port.postMessage(message);
    } catch (error) {
      console.error('Error broadcasting to UI port:', error);
    }
  });
}

// 初始化扩展
const initializeExtension = async () => {
  try {
    coreService = CoreService.getInstance();
    await coreService.initialize();
    console.log('Extension background service initialized');
    
    // 尝试连接Native Host
    ensureNativePort();
    
    // 加载插件列表
    try {
      const plugins = await sendRPC('plugin.list', {});
      console.log('Plugins loaded:', plugins);
    } catch (error) {
      console.warn('Failed to load plugins:', error);
    }
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
};

// 注册消息监听器
const registerMessageListeners = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // 监听来自UI的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Background received message:', message);
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'TEST_MESSAGE':
          sendResponse({
            success: true,
            message: 'Message processed by background script',
            received: message.payload,
            timestamp: Date.now()
          });
          break;
        
        case 'GET_COUNTER':
          if (coreService) {
            sendResponse({ counter: coreService.getCounter() });
          } else {
            sendResponse({ error: 'Core service not initialized' });
          }
          break;
        
        case 'PLUGIN_LIST':
          sendRPC('plugin.list', {})
            .then(response => sendResponse({ success: true, data: response.result }))
            .catch(error => sendResponse({ success: false, error: String(error) }));
          return true; // 异步响应
          
        case 'PLUGIN_ENABLE':
          sendRPC('plugin.enable', { name: message.name })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: String(error) }));
          return true;
          
        case 'PLUGIN_DISABLE':
          sendRPC('plugin.disable', { name: message.name })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: String(error) }));
          return true;
          
        case 'PLUGIN_CALL':
          sendRPC('plugin.call', {
            name: message.name,
            method: message.method,
            args: message.args
          })
          .then(response => sendResponse({ success: true, result: response.result }))
          .catch(error => sendResponse({ success: false, error: String(error) }));
          return true;
        
        default:
          sendResponse({ error: 'Unknown message type' });
      }
      
      return true;
    });
    
    // 监听UI连接
    chrome.runtime.onConnect.addListener(port => {
      const portId = crypto.randomUUID();
      uiPorts.set(portId, port);
      
      console.log('UI port connected:', portId);
      
      // 发送当前状态
      port.postMessage({
        type: 'STATUS_UPDATE',
        nativeHostConnected: !!nativePort
      });
      
      // 监听断开连接
      port.onDisconnect.addListener(() => {
        uiPorts.delete(portId);
        console.log('UI port disconnected:', portId);
      });
    });
  }
};

// 扩展安装时触发
const onInstalledListener = () => {
  console.log('Extension installed');
  // 初始化存储
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ counter: 0 });
  }
};

// 注册扩展安装事件
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(onInstalledListener);
}

// 启动扩展
initializeExtension();
registerMessageListeners();

console.log('Background script loaded - Plugin Architecture Ready');