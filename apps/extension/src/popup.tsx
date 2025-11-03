import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { CoreService, PluginInfo } from '@core/index';

// 简单的应用信息
const getAppInfo = () => ({
  name: 'Web Helper Extension',
  version: '0.0.0'
});

// 类型定义
interface AppState {
  counter: number;
  platformInfo: any;
  plugins: PluginInfo[];
  isLoading: boolean;
  error: string | null;
  nativeHostConnected: boolean;
}

function Popup() {
  const [state, setState] = useState<AppState>({
    counter: 0,
    platformInfo: { name: 'unknown', isDev: false },
    plugins: [],
    isLoading: false,
    error: null,
    nativeHostConnected: false
  });
  
  const appInfo = getAppInfo();
  const coreService = CoreService.getInstance();

  // 初始化和设置连接
  useEffect(() => {
    const initApp = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // 初始化 CoreService
        await coreService.initialize();
        
        // 加载初始数据
        const counter = coreService.getCounter();
        const platformInfo = coreService.getPlatformInfo();
        
        // 刷新插件列表
        await refreshPlugins();
        
        setState(prev => ({
          ...prev,
          counter,
          platformInfo,
          nativeHostConnected: coreService.isNativeHostConnected(),
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize app',
          isLoading: false
        }));
      }
    };

    initApp();

    // 建立与后台脚本的持久连接
    const port = chrome.runtime.connect();
    port.onMessage.addListener((msg) => {
      console.log('Received message from background:', msg);
      
      switch (msg.type) {
        case 'STATUS_UPDATE':
          setState(prev => ({ 
            ...prev, 
            nativeHostConnected: msg.nativeHostConnected 
          }));
          coreService.setNativeHostConnected(msg.nativeHostConnected);
          break;
        case 'NATIVE_HOST_DISCONNECTED':
          setState(prev => ({ 
            ...prev, 
            nativeHostConnected: false, 
            plugins: [] 
          }));
          coreService.setNativeHostConnected(false);
          break;
        case 'BROADCAST':
          if (msg.subject === 'PLUGIN_STATUS_CHANGED') {
            refreshPlugins();
          }
          break;
      }
    });

    return () => port.disconnect();
  }, []);

  // 刷新插件列表
  const refreshPlugins = async () => {
    try {
      const plugins = await coreService.refreshPlugins();
      setState(prev => ({ 
        ...prev, 
        plugins,
        nativeHostConnected: coreService.isNativeHostConnected()
      }));
    } catch (error) {
      console.error('Failed to refresh plugins:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load plugins',
        nativeHostConnected: false
      }));
    }
  };

  // 处理插件启用/禁用
  const handleTogglePlugin = async (plugin: PluginInfo) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (plugin.enabled) {
        await coreService.disablePlugin(plugin.name);
      } else {
        await coreService.enablePlugin(plugin.name);
      }
      
      await refreshPlugins();
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error(`Failed to toggle plugin ${plugin.name}:`, error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to toggle plugin ${plugin.name}`,
        isLoading: false
      }));
    }
  };

  // 测试调用插件
  const handleTestPlugin = async (plugin: PluginInfo) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 假设插件有echo方法作为测试
      const result = await coreService.callPlugin(plugin.name, 'echo', {
        message: 'Test from extension'
      });
      
      setState(prev => ({ 
        ...prev, 
        error: null,
        isLoading: false
      }));
      
      alert(`Plugin response:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error(`Failed to call plugin ${plugin.name}:`, error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to call plugin: ${String(error)}`,
        isLoading: false
      }));
    }
  };

  // 计数器功能
  const handleIncrement = async () => {
    try {
      const newCounter = await coreService.incrementCounter();
      setState(prev => ({ ...prev, counter: newCounter }));
    } catch (error) {
      console.error('Error incrementing counter:', error);
    }
  };

  const handleDecrement = async () => {
    try {
      const newCounter = await coreService.decrementCounter();
      setState(prev => ({ ...prev, counter: newCounter }));
    } catch (error) {
      console.error('Error decrementing counter:', error);
    }
  };

  if (state.isLoading) {
    return (
      <div style={{ padding: '16px', minWidth: '400px' }}>
        <h1>{appInfo.name} v{appInfo.version}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', minWidth: '400px', maxHeight: '600px', overflowY: 'auto' }}>
      <h1>{appInfo.name} v{appInfo.version}</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p>Platform: {state.platformInfo.name} {state.platformInfo.isDev ? '(Dev)' : ''}</p>
        <div style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: state.nativeHostConnected ? '#4CAF50' : '#F44336',
          color: 'white',
          fontSize: '12px'
        }}>
          {state.nativeHostConnected ? 'Native Host: Connected' : 'Native Host: Disconnected'}
        </div>
      </div>
      
      {/* 插件管理区域 */}
      <div style={{ marginTop: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Plugins ({state.plugins.length})</h3>
          <button 
            onClick={refreshPlugins} 
            disabled={!state.nativeHostConnected}
            style={{ opacity: state.nativeHostConnected ? 1 : 0.5 }}
          >
            Refresh
          </button>
        </div>
        
        {!state.nativeHostConnected ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Native Host not connected. Please install and start the native messaging host.</p>
        ) : state.plugins.length === 0 ? (
          <p>No plugins installed.</p>
        ) : (
          <div style={{ marginTop: '8px' }}>
            {state.plugins.map(plugin => (
              <div 
                key={plugin.name} 
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: plugin.enabled ? '#f0f8ff' : '#f5f5f5'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{plugin.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>v{plugin.version}</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Capabilities: {plugin.capabilities?.join(', ') || 'None'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <button 
                    onClick={() => handleTogglePlugin(plugin)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: plugin.enabled ? '#f44336' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {plugin.enabled ? 'Disable' : 'Enable'}
                  </button>
                  {plugin.enabled && (
                    <button 
                      onClick={() => handleTestPlugin(plugin)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      Test
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 原有计数器功能 */}
      <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <h3>Counter: {state.counter}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleDecrement}>-</button>
          <button onClick={handleIncrement}>+</button>
        </div>
      </div>

      {/* 错误信息显示 */}
      {state.error && (
        <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#ffebee', color: '#c62828' }}>
          {state.error}
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        Plugin Architecture: MV3 + Native Messaging Host
      </div>
    </div>
  );
}

// 渲染 popup 组件
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);