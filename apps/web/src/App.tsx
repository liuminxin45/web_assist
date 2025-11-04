import React, { useState, useEffect } from 'react';
import { CoreService, getAppInfo, PlatformInfo, MessageResponse } from '@core/index';

function App() {
  const [counter, setCounter] = useState(0);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [messageResponse, setMessageResponse] = useState<MessageResponse | null>(null);
  const [appInfo] = useState(getAppInfo());

  const coreService = CoreService.getInstance();

  useEffect(() => {
    // 初始化数据
    updateCounter();
    updatePlatformInfo();
  }, []);

  const updateCounter = () => {
    setCounter(coreService.getCounter());
  };

  const updatePlatformInfo = () => {
    setPlatformInfo(coreService.getPlatformInfo());
  };

  const handleIncrement = () => {
    coreService
      .incrementCounter()
      .then(() => {
        updateCounter();
      })
      .catch((error) => {
        console.error('Failed to increment counter:', error);
      });
  };

  const handleDecrement = () => {
    coreService
      .decrementCounter()
      .then(() => {
        updateCounter();
      })
      .catch((error) => {
        console.error('Failed to decrement counter:', error);
      });
  };

  const handleSendMessage = () => {
    coreService
      .sendTestMessage()
      .then((response) => {
        setMessageResponse(response);
      })
      .catch((error) => {
        console.error('Failed to send test message:', error);
      });
  };

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <header style={{ marginBottom: '30px' }}>
        <h1>{appInfo.name}</h1>
        <p style={{ color: '#666' }}>{appInfo.description}</p>
        <p>Version: {appInfo.version}</p>
      </header>

      <section
        style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h2>Platform Information</h2>
        {platformInfo && (
          <pre
            style={{
              textAlign: 'left',
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(platformInfo, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Counter</h2>
        <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0' }}>{counter}</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleDecrement}
            disabled={counter === 0}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: counter === 0 ? 'not-allowed' : 'pointer',
              opacity: counter === 0 ? 0.5 : 1,
            }}
          >
            - Decrement
          </button>
          <button
            onClick={handleIncrement}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Increment +
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Test Messaging</h2>
        <button
          onClick={handleSendMessage}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Send Test Message
        </button>
        {messageResponse && (
          <div style={{ marginTop: '20px' }}>
            <h3>Response:</h3>
            <pre
              style={{
                textAlign: 'left',
                backgroundColor: '#fff',
                padding: '15px',
                borderRadius: '4px',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(messageResponse, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <footer style={{ marginTop: '50px', color: '#666', fontSize: '14px' }}>
        <p>Multi-platform Minimal Skeleton</p>
      </footer>
    </div>
  );
}

export default App;
