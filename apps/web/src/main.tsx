import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import { setPlatform } from '@platform/index';
import { webPlatform } from '@platform/web';
import { CoreService } from '@core/index';

// 设置 Web 平台实现
setPlatform(webPlatform);

// 初始化核心服务
const initializeApp = async () => {
  try {
    const coreService = CoreService.getInstance();
    await coreService.initialize();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
};

// 渲染应用
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// 初始化应用 - 处理Promise
void initializeApp();
