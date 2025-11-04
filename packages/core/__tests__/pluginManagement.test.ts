import { CoreService, PluginInfo } from '../index';
import { setPlatform } from '../../platform/index';
import { createWebextMockPlatform } from '../../testing/index';

describe('插件管理功能测试', () => {
  let mockPlatform: any;
  let mockMessaging: any;
  let coreService: CoreService;
  let mockPluginResponse: any;

  beforeEach(async () => {
    // 重置所有模块和实例
    jest.clearAllMocks();
    jest.resetModules();

    // 创建WebExtension平台的mock
    const { platform, mockMessaging: messaging } = createWebextMockPlatform();
    mockPlatform = platform;
    mockMessaging = messaging;
    setPlatform(platform);

    // 存储原始的sendMessage方法
    const originalSendMessage = mockMessaging.sendMessage;

    // 模拟sendMessage方法，根据不同的消息类型返回不同的结果
    mockMessaging.sendMessage = async (message: any) => {
      console.log('Mock sendMessage called with:', message);
      
      // 根据消息类型返回模拟响应
      switch (message.type) {
        case 'PLUGIN_LIST':
          return {
            success: true,
            data: mockPluginResponse || getDefaultMockPlugins()
          };
        
        case 'PLUGIN_ENABLE':
          return {
            success: true,
            data: { name: message.name, enabled: true }
          };
        
        case 'PLUGIN_DISABLE':
          return {
            success: true,
            data: { name: message.name, enabled: false }
          };
        
        case 'PLUGIN_CALL':
          return {
            success: true,
            result: {
              calledMethod: message.method,
              pluginName: message.name,
              args: message.args,
              timestamp: Date.now()
            }
          };
        
        default:
          // 其他消息使用原始的mock行为
          return originalSendMessage(message);
      }
    };

    // 初始化CoreService
    coreService = CoreService.getInstance();
    await coreService.initialize();
  });

  // 获取默认的模拟插件数据
  function getDefaultMockPlugins(): PluginInfo[] {
    return [
      {
        name: 'hello_world',
        version: '1.0.0',
        enabled: true,
        capabilities: ['echo', 'sum']
      },
      {
        name: 'file_utils',
        version: '0.2.0',
        enabled: false,
        capabilities: ['file.read', 'file.list']
      }
    ];
  }

  describe('插件列表管理', () => {
    it('应该正确刷新插件列表', async () => {
      // 调用刷新插件方法
      const plugins = await coreService.refreshPlugins();
      
      // 验证返回的插件列表
      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('hello_world');
      expect(plugins[0].enabled).toBe(true);
      expect(plugins[1].name).toBe('file_utils');
      expect(plugins[1].enabled).toBe(false);
      
      // 验证Native Host连接状态为true
      const platformInfo = coreService.getPlatformInfo();
      expect(platformInfo.nativeHostConnected).toBe(true);
    });

    it('应该正确返回插件列表', () => {
      // 先刷新插件列表
      const plugins = coreService.getPlugins();
      
      // 验证getPlugins方法返回的是副本
      expect(plugins).toHaveLength(2);
      expect(plugins).not.toBe(coreService.getPlugins()); // 应该是不同的引用
      
      // 修改返回的插件列表不应该影响内部状态
      plugins[0].enabled = false;
      const updatedPlugins = coreService.getPlugins();
      expect(updatedPlugins[0].enabled).toBe(true); // 内部状态不变
    });

    it('应该正确获取单个插件信息', () => {
      const plugin = coreService.getPlugin('hello_world');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('hello_world');
      expect(plugin?.version).toBe('1.0.0');
      
      // 测试获取不存在的插件
      const nonExistent = coreService.getPlugin('non_existent');
      expect(nonExistent).toBeUndefined();
    });

    it('插件列表刷新失败时应正确处理错误', async () => {
      // 模拟错误响应
      mockPluginResponse = null;
      mockMessaging.sendMessage = async () => ({
        success: false,
        error: 'Connection failed'
      });
      
      // 捕获控制台错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // 调用刷新方法
      const plugins = await coreService.refreshPlugins();
      
      // 验证返回空数组
      expect(plugins).toEqual([]);
      
      // 验证Native Host连接状态为false
      const platformInfo = coreService.getPlatformInfo();
      expect(platformInfo.nativeHostConnected).toBe(false);
      
      // 验证错误日志
      expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh plugins:', 'Connection failed');
      
      // 清理
      consoleSpy.mockRestore();
    });

    it('刷新插件时抛出异常应正确处理', async () => {
      // 模拟抛出异常
      mockMessaging.sendMessage = async () => {
        throw new Error('Network error');
      };
      
      // 捕获控制台错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // 调用刷新方法
      const plugins = await coreService.refreshPlugins();
      
      // 验证返回空数组
      expect(plugins).toEqual([]);
      
      // 验证Native Host连接状态为false
      expect(coreService.getPlatformInfo().nativeHostConnected).toBe(false);
      
      // 验证错误日志
      expect(consoleSpy).toHaveBeenCalledWith('Error refreshing plugins:', expect.any(Error));
      
      // 清理
      consoleSpy.mockRestore();
    });
  });

  describe('插件启用/禁用功能', () => {
    it('应该正确启用插件', async () => {
      // 先将插件设置为禁用状态
      mockPluginResponse = [
        {
          name: 'test_plugin',
          version: '1.0.0',
          enabled: false,
          capabilities: ['test']
        }
      ];
      
      // 刷新插件列表
      await coreService.refreshPlugins();
      
      // 调用启用方法
      const result = await coreService.enablePlugin('test_plugin');
      
      // 验证启用成功
      expect(result).toBe(true);
      
      // 验证插件状态已更新
      const updatedPlugin = coreService.getPlugin('test_plugin');
      expect(updatedPlugin?.enabled).toBe(true);
    });

    it('应该正确禁用插件', async () => {
      // 先将插件设置为启用状态
      mockPluginResponse = [
        {
          name: 'test_plugin',
          version: '1.0.0',
          enabled: true,
          capabilities: ['test']
        }
      ];
      
      // 刷新插件列表
      await coreService.refreshPlugins();
      
      // 调用禁用方法
      const result = await coreService.disablePlugin('test_plugin');
      
      // 验证禁用成功
      expect(result).toBe(true);
      
      // 验证插件状态已更新
      const updatedPlugin = coreService.getPlugin('test_plugin');
      expect(updatedPlugin?.enabled).toBe(false);
    });

    it('启用不存在的插件应返回false', async () => {
      const result = await coreService.enablePlugin('non_existent_plugin');
      expect(result).toBe(false);
    });

    it('禁用不存在的插件应返回false', async () => {
      const result = await coreService.disablePlugin('non_existent_plugin');
      expect(result).toBe(false);
    });

    it('启用插件时的错误应被正确处理', async () => {
      // 模拟错误响应
      mockMessaging.sendMessage = async (message: any) => {
        if (message.type === 'PLUGIN_ENABLE') {
          throw new Error('Failed to enable');
        }
        return { success: true, data: [] };
      };
      
      // 捕获控制台错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await coreService.enablePlugin('hello_world');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error enabling plugin:', expect.any(Error));
      
      // 清理
      consoleSpy.mockRestore();
    });
  });

  describe('插件方法调用功能', () => {
    it('应该正确调用插件方法', async () => {
      // 准备测试参数
      const pluginName = 'hello_world';
      const method = 'echo';
      const args = { message: 'test content' };
      
      // 调用插件方法
      const result = await coreService.callPlugin(pluginName, method, args);
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.pluginName).toBe(pluginName);
      expect(result.calledMethod).toBe(method);
      expect(result.args).toEqual(args);
      expect(result.timestamp).toBeDefined();
    });

    it('调用不存在的插件应抛出错误', async () => {
      // 模拟错误响应
      mockMessaging.sendMessage = async (message: any) => {
        if (message.type === 'PLUGIN_CALL') {
          return { success: false, error: 'Plugin not found' };
        }
        return { success: true, data: [] };
      };
      
      // 验证抛出错误
      await expect(coreService.callPlugin('non_existent', 'test', {})).rejects.toThrow(
        'Plugin not found'
      );
    });

    it('调用插件时的错误应被正确处理', async () => {
      // 模拟抛出异常
      mockMessaging.sendMessage = async (message: any) => {
        if (message.type === 'PLUGIN_CALL') {
          throw new Error('Communication error');
        }
        return { success: true, data: [] };
      };
      
      // 捕获控制台错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // 验证抛出错误
      await expect(coreService.callPlugin('hello_world', 'test', {})).rejects.toThrow(
        'Communication error'
      );
      
      expect(consoleSpy).toHaveBeenCalledWith('Error calling plugin:', expect.any(Error));
      
      // 清理
      consoleSpy.mockRestore();
    });
  });

  describe('Native Host连接状态管理', () => {
    it('初始化时应尝试加载插件并设置连接状态', async () => {
      // 重置并重新初始化
      jest.resetModules();
      const { platform } = createWebextMockPlatform();
      setPlatform(platform);
      
      // 模拟成功的插件加载
      platform.messaging.sendMessage = async () => ({
        success: true,
        data: getDefaultMockPlugins()
      });
      
      // 捕获控制台警告
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const newCoreService = CoreService.getInstance();
      await newCoreService.initialize();
      
      // 验证连接状态
      expect(newCoreService.getPlatformInfo().nativeHostConnected).toBe(true);
      
      // 验证没有警告日志
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      
      // 清理
      consoleWarnSpy.mockRestore();
    });

    it('初始化时插件加载失败不应阻止服务启动', async () => {
      // 重置并重新初始化
      jest.resetModules();
      const { platform } = createWebextMockPlatform();
      setPlatform(platform);
      
      // 模拟插件加载失败
      platform.messaging.sendMessage = async () => {
        throw new Error('Plugin load failure');
      };
      
      // 捕获控制台警告
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const newCoreService = CoreService.getInstance();
      await newCoreService.initialize();
      
      // 验证连接状态为false
      expect(newCoreService.getPlatformInfo().nativeHostConnected).toBe(false);
      
      // 验证警告日志
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load plugins during initialization:',
        expect.any(Error)
      );
      
      // 清理
      consoleWarnSpy.mockRestore();
    });
  });
});

// 扩展测试：测试跨平台兼容性
// 由于插件系统主要在WebExtension环境中使用，我们还需要确保在其他平台上有适当的回退行为
describe('插件系统跨平台兼容性测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('在web平台上应输出警告并返回空数组', async () => {
    // 创建Web平台的mock
    const { platform } = createWebextMockPlatform();
    platform.name = 'web'; // 修改为web平台
    setPlatform(platform);
    
    const coreService = CoreService.getInstance();
    
    // 捕获控制台警告
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // 验证在web平台上刷新插件应返回空数组
    const plugins = await coreService.refreshPlugins();
    
    // 验证返回值
    expect(plugins).toEqual([]);
    expect(coreService.getPlatformInfo().nativeHostConnected).toBe(false);
    
    // 验证输出了警告信息
    expect(consoleWarnSpy).toHaveBeenCalledWith('Plugins are not supported in web environment');
    
    // 清理
    consoleWarnSpy.mockRestore();
  });
  
  it('在electron平台上处理sendMessage错误', async () => {
    // 创建electron平台的mock
    const { platform } = createWebextMockPlatform();
    platform.name = 'electron'; // 修改为electron平台
    setPlatform(platform);
    
    const coreService = CoreService.getInstance();
    
    // 模拟sendMessage抛出错误
    platform.messaging.sendMessage = async () => {
      throw new Error('Platform not supported');
    };
    
    // 捕获控制台错误
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // 调用刷新插件方法
    const plugins = await coreService.refreshPlugins();
    
    // 验证返回值
    expect(plugins).toEqual([]);
    expect(coreService.getPlatformInfo().nativeHostConnected).toBe(false);
    
    // 验证输出了错误信息
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error refreshing plugins:', expect.any(Error));
    
    // 清理
    consoleErrorSpy.mockRestore();
  });
});