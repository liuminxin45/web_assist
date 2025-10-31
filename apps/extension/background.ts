import { setPlatform } from '@platform/index';
import { webextPlatform } from '@platform/webext';
import { CoreService } from '@core/index';

// 设置 WebExtension 平台实现
setPlatform(webextPlatform);

// 初始化核心服务
let coreService: CoreService | null = null;

const initializeExtension = async () => {
  try {
    coreService = CoreService.getInstance();
    await coreService.initialize();
    console.log('Extension background service initialized');
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
};

// 注册消息监听器
const registerMessageListeners = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Background received message:', message);
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'TEST_MESSAGE':
          // 模拟消息处理
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
        
        default:
          sendResponse({ error: 'Unknown message type' });
      }
      
      // 返回 true 表示异步响应
      return true;
    });
  }
};

// 扩展安装时触发
const onInstalledListener = () => {
  console.log('Extension installed');
  // 可以在这里执行一些初始化操作，如设置默认值等
};

// 注册扩展安装事件
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(onInstalledListener);
}

// 启动扩展
initializeExtension();
registerMessageListeners();

console.log('Background script loaded');