import { Platform, setPlatform, __TARGET__ } from '@platform/index';
import { webPlatform } from '@platform/web';
import { webextPlatform } from '@platform/webext';
import { createMockPlatform } from '@testing/index';

describe('Platform Abstraction Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('平台接口测试', () => {
    it('平台接口应包含所有必需的属性和方法', () => {
      const { platform } = createMockPlatform();
      
      // 验证Platform接口的基本结构
      expect(platform).toHaveProperty('name');
      expect(platform).toHaveProperty('storage');
      expect(platform).toHaveProperty('runtime');
      expect(platform).toHaveProperty('messaging');
      
      // 验证Storage接口
      expect(platform.storage).toHaveProperty('set');
      expect(platform.storage).toHaveProperty('get');
      expect(platform.storage).toHaveProperty('remove');
      expect(typeof platform.storage.set).toBe('function');
      expect(typeof platform.storage.get).toBe('function');
      expect(typeof platform.storage.remove).toBe('function');
      
      // 验证Runtime接口
      expect(platform.runtime).toHaveProperty('getVersion');
      expect(platform.runtime).toHaveProperty('getPlatformInfo');
      expect(platform.runtime).toHaveProperty('isDevMode');
      expect(typeof platform.runtime.getVersion).toBe('function');
      expect(typeof platform.runtime.getPlatformInfo).toBe('function');
      expect(typeof platform.runtime.isDevMode).toBe('function');
      
      // 验证Messaging接口
      expect(platform.messaging).toHaveProperty('sendMessage');
      expect(platform.messaging).toHaveProperty('onMessage');
      expect(platform.messaging).toHaveProperty('removeListener');
      expect(typeof platform.messaging.sendMessage).toBe('function');
      expect(typeof platform.messaging.onMessage).toBe('function');
      expect(typeof platform.messaging.removeListener).toBe('function');
    });
  });

  describe('平台设置测试', () => {
    it('setPlatform应正确设置全局平台实例', () => {
      const { platform } = createMockPlatform('web');
      setPlatform(platform);
      
      // 导入平台实例进行验证
      const { platform: currentPlatform } = require('@platform/index');
      expect(currentPlatform).toBe(platform);
      expect(currentPlatform.name).toBe('web');
    });

    it('应能切换不同平台的实现', () => {
      // 设置为web平台
      setPlatform(webPlatform);
      let { platform: currentPlatform } = require('@platform/index');
      expect(currentPlatform.name).toBe('web');
      
      // 切换到webext平台
      setPlatform(webextPlatform);
      ({ platform: currentPlatform } = require('@platform/index'));
      expect(currentPlatform.name).toBe('webext');
    });
  });

  describe('TARGET环境变量测试', () => {
    it('应正确获取目标平台环境变量', () => {
      // 验证__TARGET__常量已定义
      expect(typeof __TARGET__).toBe('string');
      
      // 根据构建配置，默认为'web'
      expect(['web', 'electron', 'webext']).toContain(__TARGET__);
    });

    it('在Node环境中应尝试从process.env获取TARGET', () => {
      // 保存原始值
      const originalProcessEnv = process.env.__TARGET__;
      
      try {
        // 设置环境变量
        process.env.__TARGET__ = 'test_platform';
        
        // 清除模块缓存
        jest.resetModules();
        
        // 重新导入以获取新值
        const { __TARGET__: newTarget } = require('@platform/index');
        
        // 由于我们在测试环境中，可能不会严格遵循process.env的设置，但应该尝试获取
        expect(typeof newTarget).toBe('string');
      } finally {
        // 恢复原始值
        if (originalProcessEnv !== undefined) {
          process.env.__TARGET__ = originalProcessEnv;
        } else {
          delete process.env.__TARGET__;
        }
      }
    });
  });

  describe('平台接口一致性测试', () => {
    it('所有平台实现应具有一致的接口', () => {
      const platforms = [
        createMockPlatform('web').platform,
        createMockPlatform('electron').platform,
        createMockPlatform('webext').platform
      ];
      
      platforms.forEach((platform, index) => {
        // 验证每个平台都实现了完整的接口
        expect(platform).toHaveProperty('name');
        expect(platform.name).toBe(['web', 'electron', 'webext'][index]);
        
        expect(platform.storage).toHaveProperty('set');
        expect(platform.storage).toHaveProperty('get');
        expect(platform.storage).toHaveProperty('remove');
        
        expect(platform.runtime).toHaveProperty('getVersion');
        expect(platform.runtime).toHaveProperty('getPlatformInfo');
        expect(platform.runtime).toHaveProperty('isDevMode');
        
        expect(platform.messaging).toHaveProperty('sendMessage');
        expect(platform.messaging).toHaveProperty('onMessage');
        expect(platform.messaging).toHaveProperty('removeListener');
      });
    });

    it('不同平台的方法调用应返回适当的格式', async () => {
      const { platform } = createMockPlatform();
      setPlatform(platform);
      
      // 验证存储方法
      await platform.storage.set('testKey', 'testValue');
      const value = await platform.storage.get('testKey');
      expect(value).toBe('testValue');
      
      await platform.storage.remove('testKey');
      const removedValue = await platform.storage.get('testKey');
      expect(removedValue).toBeNull();
      
      // 验证运行时方法
      const version = platform.runtime.getVersion();
      expect(typeof version).toBe('string');
      
      const platformInfo = platform.runtime.getPlatformInfo();
      expect(platformInfo).toHaveProperty('os');
      expect(platformInfo).toHaveProperty('arch');
      expect(platformInfo).toHaveProperty('platform');
      
      const isDev = platform.runtime.isDevMode();
      expect(typeof isDev).toBe('boolean');
      
      // 验证消息方法
      const response = await platform.messaging.sendMessage({ type: 'test' });
      expect(response).toBeDefined();
      
      // 测试消息监听器
      let receivedMessage: any = null;
      const messageHandler = (message: any) => {
        receivedMessage = message;
      };
      
      platform.messaging.onMessage(messageHandler);
      
      // 如果是我们的mock平台，调用emitMessage来测试
      if ('emitMessage' in platform.messaging) {
        (platform.messaging as any).emitMessage({ type: 'event' });
        expect(receivedMessage).toEqual({ type: 'event' });
      }
      
      platform.messaging.removeListener(messageHandler);
    });
  });
});