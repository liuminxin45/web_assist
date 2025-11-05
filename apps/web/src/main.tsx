import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import { setPlatform } from '@platform/index';
import { webPlatform } from '@platform/web';

// 设置 Web 平台实现
setPlatform(webPlatform);

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
