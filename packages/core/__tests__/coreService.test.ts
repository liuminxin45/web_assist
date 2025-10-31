import { CoreService } from '@core/index';
import { setPlatform } from '@platform/index';
import {
  createWebMockPlatform,
  createElectronMockPlatform,
  createWebextMockPlatform
} from '@testing/index';

describe('CoreService', () => {
  beforeEach(() => {
    // 重置单例实例
    jest.clearAllMocks();
    // 清除Node.js的模块缓存，确保每次测试都有新的实例
    jest.resetModules();
  });

  describe('单例模式测试', () => {
    it('应该返回相同的实例', async () => {
      const { platform } = createWebMockPlatform();
      setPlatform(platform);
      
      const instance1 = CoreService.getInstance();
      const instance2 = CoreService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('在Web平台上的测试', () => {
    let mockStorage: any;
    let mockRuntime: any;
    let mockMessaging: any;
    let coreService: CoreService;

    beforeEach(async () => {
      const { platform, mockStorage: storage, mockRuntime: runtime, mockMessaging: messaging } = createWebMockPlatform();
      mockStorage = storage;
      mockRuntime = runtime;
      mockMessaging = messaging;
      setPlatform(platform);
      
      coreService = CoreService.getInstance();
      await coreService.initialize();
    });

    it('初始化时应从存储加载计数器', async () => {
      // 预设存储数据
      await mockStorage.set('counter', 42);
      
      // 重新初始化服务
      await coreService.initialize();
      
      expect(coreService.getCounter()).toBe(42);
    });

    it('增加计数器应更新值并保存到存储', async () => {
      const newValue = await coreService.incrementCounter();
      
      expect(newValue).toBe(1);
      expect(coreService.getCounter()).toBe(1);
      expect(await mockStorage.get('counter')).toBe(1);
    });

    it('减少计数器应更新值并保存到存储', async () => {
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      
      const newValue = await coreService.decrementCounter();
      
      expect(newValue).toBe(1);
      expect(coreService.getCounter()).toBe(1);
      expect(await mockStorage.get('counter')).toBe(1);
    });

    it('计数器不应小于0', async () => {
      const newValue = await coreService.decrementCounter();
      
      expect(newValue).toBe(0);
      expect(coreService.getCounter()).toBe(0);
    });

    it('获取平台信息应返回正确的Web平台信息', () => {
      const platformInfo = coreService.getPlatformInfo();
      
      expect(platformInfo.name).toBe('web');
      expect(platformInfo.version).toBe(mockRuntime.getVersion());
      expect(platformInfo.isDev).toBe(true);
      expect(platformInfo.platformDetails).toEqual(mockRuntime.getPlatformInfo());
    });

    it('发送测试消息应返回成功响应', async () => {
      const response = await coreService.sendTestMessage();
      
      expect(response.success).toBe(true);
      expect(response.data.type).toBe('TEST_MESSAGE');
      expect(response.platform).toBe('mock');
      
      // 验证消息是否通过mockMessaging发送
      const sentMessages = mockMessaging.getSentMessages();
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0].type).toBe('TEST_MESSAGE');
    });
  });

  describe('在Electron平台上的测试', () => {
    let mockStorage: any;
    let coreService: CoreService;

    beforeEach(async () => {
      const { platform, mockStorage: storage } = createElectronMockPlatform();
      mockStorage = storage;
      setPlatform(platform);
      
      coreService = CoreService.getInstance();
      await coreService.initialize();
    });

    it('应正确标识为Electron平台', () => {
      const platformInfo = coreService.getPlatformInfo();
      
      expect(platformInfo.name).toBe('electron');
      expect(platformInfo.platformDetails.platform).toBe('electron');
    });

    it('Electron平台上的计数器功能应正常工作', async () => {
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      
      expect(coreService.getCounter()).toBe(2);
      expect(await mockStorage.get('counter')).toBe(2);
    });
  });

  describe('在WebExtension平台上的测试', () => {
    let mockStorage: any;
    let mockMessaging: any;
    let coreService: CoreService;

    beforeEach(async () => {
      const { platform, mockStorage: storage, mockMessaging: messaging } = createWebextMockPlatform();
      mockStorage = storage;
      mockMessaging = messaging;
      setPlatform(platform);
      
      coreService = CoreService.getInstance();
      await coreService.initialize();
    });

    it('应正确标识为WebExtension平台', () => {
      const platformInfo = coreService.getPlatformInfo();
      
      expect(platformInfo.name).toBe('webext');
      expect(platformInfo.platformDetails.platform).toBe('webextension');
    });

    it('WebExtension平台上的消息发送功能应正常工作', async () => {
      const response = await coreService.sendTestMessage();
      
      expect(response.success).toBe(true);
      
      const sentMessages = mockMessaging.getSentMessages();
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0].type).toBe('TEST_MESSAGE');
    });
  });

  describe('错误处理测试', () => {
    it('初始化时存储错误不应阻止服务启动', async () => {
      // 模拟存储错误
      const { platform } = createWebMockPlatform();
      const originalGet = platform.storage.get;
      platform.storage.get = async () => {
        throw new Error('Storage error');
      };
      
      setPlatform(platform);
      
      // 捕获控制台错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const coreService = CoreService.getInstance();
      await coreService.initialize();
      
      // 验证错误被正确处理
      expect(consoleSpy).toHaveBeenCalledWith('Error initializing CoreService:', expect.any(Error));
      expect(coreService.getCounter()).toBe(0); // 默认为0
      
      // 恢复原始方法和控制台
      platform.storage.get = originalGet;
      consoleSpy.mockRestore();
    });

    it('发送消息时的错误应被正确处理', async () => {
      // 模拟消息发送错误
      const { platform } = createWebMockPlatform();
      const originalSendMessage = platform.messaging.sendMessage;
      platform.messaging.sendMessage = async () => {
        throw new Error('Messaging error');
      };
      
      setPlatform(platform);
      
      // 捕获控制台错误
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const coreService = CoreService.getInstance();
      const response = await coreService.sendTestMessage();
      
      // 验证错误被正确处理
      expect(consoleSpy).toHaveBeenCalledWith('Error sending test message:', expect.any(Error));
      expect(response.error).toBe('Error: Messaging error');
      
      // 恢复原始方法和控制台
      platform.messaging.sendMessage = originalSendMessage;
      consoleSpy.mockRestore();
    });
  });
});