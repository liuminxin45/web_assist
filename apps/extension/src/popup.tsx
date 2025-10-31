import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { setPlatform } from '@platform/index';
import { webextPlatform } from '@platform/webext';
import { CoreService, getAppInfo } from '@core/index';

// 设置 WebExtension 平台实现
setPlatform(webextPlatform);

function Popup() {
  const [counter, setCounter] = useState(0);
  const [platformInfo, setPlatformInfo] = useState<any>(null);
  const [messageResponse, setMessageResponse] = useState<any>(null);
  const [appInfo] = useState(getAppInfo());

  const coreService = CoreService.getInstance();

  useEffect(() => {
    // 初始化数据
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await coreService.initialize();
      updateCounter();
      updatePlatformInfo();
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    }
  };

  const updateCounter = () => {
    setCounter(coreService.getCounter());
  };

  const updatePlatformInfo = () => {
    setPlatformInfo(coreService.getPlatformInfo());
  };

  const handleIncrement = async () => {
    await coreService.incrementCounter();
    updateCounter();
  };

  const handleDecrement = async () => {
    await coreService.decrementCounter();
    updateCounter();
  };

  const handleSendMessage = async () => {
    const response = await coreService.sendTestMessage();
    setMessageResponse(response);
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <header style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>{appInfo.name} (Extension)</h2>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>v{appInfo.version}</p>
      </header>

      <section style={{ marginBottom: '20px', fontSize: '12px' }}>
        <p style={{ margin: '5px 0' }}>Platform: {platformInfo?.name}</p>
        <p style={{ margin: '5px 0' }}>Dev Mode: {platformInfo?.isDev ? 'Yes' : 'No'}</p>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '10px 0' }}>Counter</h3>
        <div style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
          {counter}
        </div>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          <button 
            onClick={handleDecrement} 
            disabled={counter === 0}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: counter === 0 ? 'not-allowed' : 'pointer',
              opacity: counter === 0 ? 0.5 : 1
            }}
          >
            -
          </button>
          <button 
            onClick={handleIncrement}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
      </section>

      <section>
        <button 
          onClick={handleSendMessage}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Test Message
        </button>
        {messageResponse && (
          <div style={{ marginTop: '10px', fontSize: '10px', textAlign: 'left' }}>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '8px', margin: '5px 0', overflowX: 'auto' }}>
              {JSON.stringify(messageResponse, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}

// 渲染 popup 组件
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);