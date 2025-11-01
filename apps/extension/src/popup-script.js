// CoreService 模拟类 - 修改为单例模式
const CoreService = (() => {
  // 创建单例实例
  let instance = null;
  
  // 获取单例实例的方法
  const getInstance = () => {
    if (!instance) {
      instance = {
        counter: 0,
        initialize: async () => Promise.resolve(),
        getCounter: function() { return this.counter; },
        incrementCounter: async function() { 
          this.counter++;
          return this.counter;
        },
        decrementCounter: async function() { 
          if (this.counter > 0) this.counter--;
          return this.counter;
        },
        getPlatformInfo: () => ({
          name: 'webext',
          isDev: true
        }),
        sendTestMessage: async () => Promise.resolve({
          status: 'success',
          message: 'Test message sent'
        })
      };
    }
    return instance;
  };
  
  return { getInstance };
})();

// 应用信息
const getAppInfo = () => ({
  name: 'Web Helper Extension',
  version: '0.0.0'
});

// Popup 组件
function Popup() {
  const [counter, setCounter] = React.useState(0);
  const [platformInfo, setPlatformInfo] = React.useState(null);
  const [messageResponse, setMessageResponse] = React.useState(null);
  const [appInfo] = React.useState(getAppInfo());

  const coreService = CoreService.getInstance();

  React.useEffect(() => {
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

  // 重写渲染部分，确保所有元素都有唯一key
  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  };

  return React.createElement(
    'div',
    { style: containerStyle },
    // 使用单独的元素而不是数组，避免key警告
    React.createElement(
      'header',
      { style: { marginBottom: '20px' } },
      React.createElement('h2', { style: { margin: '0 0 10px 0' } }, `${appInfo.name} (Extension)`),
      React.createElement('p', { style: { margin: '5px 0', color: '#666', fontSize: '12px' } }, `v${appInfo.version}`)
    ),
    
    React.createElement(
      'section',
      { style: { marginBottom: '20px', fontSize: '12px' } },
      React.createElement('p', { style: { margin: '5px 0' } }, `Platform: ${platformInfo?.name}`),
      React.createElement('p', { style: { margin: '5px 0' } }, `Dev Mode: ${platformInfo?.isDev ? 'Yes' : 'No'}`)
    ),
    
    React.createElement(
      'section',
      { style: { marginBottom: '20px' } },
      React.createElement('h3', { style: { margin: '10px 0' } }, 'Counter'),
      React.createElement('div', { style: { fontSize: '36px', fontWeight: 'bold', margin: '10px 0' } }, counter),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '5px', justifyContent: 'center' } },
        React.createElement(
          'button',
          {
            onClick: handleDecrement,
            disabled: counter === 0,
            style: {
              padding: '8px 16px',
              fontSize: '14px',
              cursor: counter === 0 ? 'not-allowed' : 'pointer',
              opacity: counter === 0 ? 0.5 : 1
            }
          },
          '-'
        ),
        React.createElement(
          'button',
          {
            onClick: handleIncrement,
            style: {
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          },
          '+'
        )
      )
    ),
    
    React.createElement(
      'section',
      null,
      React.createElement(
        'button',
        {
          onClick: handleSendMessage,
          style: {
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%'
          }
        },
        'Test Message'
      ),
      messageResponse && React.createElement(
        'div',
        {
          style: { marginTop: '10px', fontSize: '10px', textAlign: 'left' }
        },
        React.createElement(
          'pre',
          {
            style: {
              backgroundColor: '#f5f5f5',
              padding: '8px',
              margin: '5px 0',
              overflowX: 'auto'
            }
          },
          JSON.stringify(messageResponse, null, 2)
        )
      )
    )
  );
}

// 渲染函数
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      React.createElement(React.StrictMode, null, 
        React.createElement(Popup)
      )
    );
  }
});