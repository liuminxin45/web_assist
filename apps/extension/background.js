// 简单的background.js文件用于Chrome扩展
console.log('Background script loaded');

// 监听消息
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    // 处理基本消息
    switch (message.type) {
      case 'TEST_MESSAGE':
        sendResponse({
          success: true,
          message: 'Message processed by background script',
          received: message.payload,
          timestamp: Date.now()
        });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
    
    return true;
  });
  
  // 监听安装事件
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
}

// 简单的存储示例
if (typeof chrome !== 'undefined' && chrome.storage) {
  // 设置默认值
  chrome.storage.local.set({ counter: 0 });
}