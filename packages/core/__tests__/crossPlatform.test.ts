import { CoreService } from '@core/index';
import { setPlatform } from '@platform/index';
import {
  createWebMockPlatform,
  createElectronMockPlatform,
  createWebextMockPlatform
} from '@testing/index';

describe('跨平台一致性测试', () => {
  beforeEach(() => {
    // 重置单例实例
    jest.clearAllMocks();
    jest.resetModules();
  });

  /**
   * 测试在所有平台上核心计数器功能的一致性
   */
  it('在所有平台上计数器功能应保持一致', async () => {
    // 定义要测试的平台
    const platforms = [
      { name: 'Web', factory: createWebMockPlatform },
      { name: 'Electron', factory: createElectronMockPlatform },
      { name: 'WebExtension', factory: createWebextMockPlatform }
    ];

    // 对每个平台执行相同的测试步骤
    for (const { name, factory } of platforms) {
      console.log(`\n测试 ${name} 平台...`);
      
      const { platform, mockStorage } = factory();
      setPlatform(platform);
      
      const coreService = CoreService.getInstance();
      
      // 步骤1: 初始化服务
      await coreService.initialize();
      expect(coreService.getCounter()).toBe(0);
      
      // 步骤2: 增加计数器3次
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      expect(coreService.getCounter()).toBe(3);
      expect(await mockStorage.get('counter')).toBe(3);
      
      // 步骤3: 减少计数器2次
      await coreService.decrementCounter();
      await coreService.decrementCounter();
      expect(coreService.getCounter()).toBe(1);
      expect(await mockStorage.get('counter')).toBe(1);
      
      // 步骤4: 测试边界情况 - 尝试减到负数
      await coreService.decrementCounter();
      await coreService.decrementCounter(); // 第二次调用不应改变值
      expect(coreService.getCounter()).toBe(0);
      expect(await mockStorage.get('counter')).toBe(0);
      
      // 步骤5: 清除存储，验证重新初始化
      await mockStorage.remove('counter');
      await coreService.initialize();
      expect(coreService.getCounter()).toBe(0); // 应为默认值
      
      console.log(`✅ ${name} 平台测试通过`);
    }
  });

  /**
   * 测试在所有平台上平台信息获取的一致性
   */
  it('在所有平台上平台信息获取应保持一致的格式', async () => {
    const platforms = [
      { name: 'Web', factory: createWebMockPlatform },
      { name: 'Electron', factory: createElectronMockPlatform },
      { name: 'WebExtension', factory: createWebextMockPlatform }
    ];

    for (const { name, factory } of platforms) {
      console.log(`\n测试 ${name} 平台信息...`);
      
      const { platform } = factory();
      setPlatform(platform);
      
      const coreService = CoreService.getInstance();
      await coreService.initialize();
      
      const platformInfo = coreService.getPlatformInfo();
      
      // 验证返回的平台信息格式在所有平台上保持一致
      expect(platformInfo).toHaveProperty('name');
      expect(platformInfo).toHaveProperty('version');
      expect(platformInfo).toHaveProperty('isDev');
      expect(platformInfo).toHaveProperty('platformDetails');
      
      // 验证特定字段的类型
      expect(typeof platformInfo.name).toBe('string');
      expect(typeof platformInfo.version).toBe('string');
      expect(typeof platformInfo.isDev).toBe('boolean');
      expect(typeof platformInfo.platformDetails).toBe('object');
      
      // 验证platformDetails包含预期的字段
      expect(platformInfo.platformDetails).toHaveProperty('os');
      expect(platformInfo.platformDetails).toHaveProperty('arch');
      expect(platformInfo.platformDetails).toHaveProperty('platform');
      
      console.log(`✅ ${name} 平台信息测试通过`);
    }
  });

  /**
   * 测试在所有平台上消息发送功能的一致性
   */
  it('在所有平台上消息发送功能应保持一致的接口', async () => {
    const platforms = [
      { name: 'Web', factory: createWebMockPlatform },
      { name: 'Electron', factory: createElectronMockPlatform },
      { name: 'WebExtension', factory: createWebextMockPlatform }
    ];

    for (const { name, factory } of platforms) {
      console.log(`\n测试 ${name} 平台消息发送...`);
      
      const { platform, mockMessaging } = factory();
      setPlatform(platform);
      
      const coreService = CoreService.getInstance();
      await coreService.initialize();
      
      // 设置计数器值，确保它包含在消息中
      await coreService.incrementCounter();
      const counterValue = coreService.getCounter();
      
      // 发送测试消息
      const response = await coreService.sendTestMessage();
      
      // 验证响应格式在所有平台上保持一致
      expect(response).toHaveProperty('success');
      expect(response.success).toBe(true);
      
      // 验证消息队列中包含了正确的消息
      const sentMessages = mockMessaging.getSentMessages();
      expect(sentMessages.length).toBeGreaterThan(0);
      
      const lastMessage = sentMessages[sentMessages.length - 1];
      expect(lastMessage).toHaveProperty('type');
      expect(lastMessage).toHaveProperty('payload');
      expect(lastMessage.type).toBe('TEST_MESSAGE');
      expect(lastMessage.payload).toHaveProperty('counter');
      expect(lastMessage.payload.counter).toBe(counterValue);
      
      console.log(`✅ ${name} 平台消息发送测试通过`);
    }
  });

  /**
   * 测试在不同平台间切换时核心逻辑的稳定性
   */
  it('平台切换时核心逻辑应保持稳定', async () => {
    // 1. 初始化为Web平台并设置状态
    console.log('\n测试平台切换...');
    const { platform: webPlatform, mockStorage: webStorage } = createWebMockPlatform();
    setPlatform(webPlatform);
    
    let coreService = CoreService.getInstance();
    await coreService.initialize();
    await coreService.incrementCounter();
    await coreService.incrementCounter();
    
    const webCounter = coreService.getCounter();
    expect(webCounter).toBe(2);
    
    // 2. 重置模块并切换到Electron平台
    jest.resetModules();
    const { setPlatform: setPlatform2 } = require('@platform/index');
    const { CoreService: CoreService2 } = require('@core/index');
    const { createElectronMockPlatform: createElectronMockPlatform2 } = require('@testing/index');
    
    const { platform: electronPlatform, mockStorage: electronStorage } = createElectronMockPlatform2();
    setPlatform2(electronPlatform);
    
    coreService = CoreService2.getInstance();
    await coreService.initialize();
    
    // 在Electron平台上设置不同的计数器值
    await coreService.incrementCounter();
    await coreService.incrementCounter();
    await coreService.incrementCounter();
    
    const electronCounter = coreService.getCounter();
    expect(electronCounter).toBe(3);
    expect(await electronStorage.get('counter')).toBe(3);
    
    // 3. 验证两个平台的存储是独立的
    expect(await webStorage.get('counter')).toBe(2); // Web平台的存储应该保持不变
    
    console.log('✅ 平台切换测试通过');
  });

  /**
   * 模拟真实用户操作流程在不同平台上的执行
   */
  it('应能在所有平台上成功执行典型用户操作流程', async () => {
    const platforms = [
      { name: 'Web', factory: createWebMockPlatform },
      { name: 'Electron', factory: createElectronMockPlatform },
      { name: 'WebExtension', factory: createWebextMockPlatform }
    ];

    for (const { name, factory } of platforms) {
      console.log(`\n测试 ${name} 平台用户操作流程...`);
      
      const { platform, mockStorage, mockMessaging } = factory();
      setPlatform(platform);
      
      // 创建核心服务实例
      const coreService = CoreService.getInstance();
      
      // 模拟用户打开应用
      await coreService.initialize();
      expect(coreService.getCounter()).toBe(0);
      
      // 模拟用户增加计数
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      expect(coreService.getCounter()).toBe(3);
      
      // 模拟用户检查平台信息
      const platformInfo = coreService.getPlatformInfo();
      expect(platformInfo.name).toBe(platform.name);
      
      // 模拟用户发送消息
      const messageResponse = await coreService.sendTestMessage();
      expect(messageResponse.success).toBe(true);
      
      // 模拟用户减少计数
      await coreService.decrementCounter();
      await coreService.decrementCounter();
      expect(coreService.getCounter()).toBe(1);
      
      // 模拟用户关闭应用后重新打开（验证数据持久化）
      await coreService.initialize();
      expect(coreService.getCounter()).toBe(1);
      
      console.log(`✅ ${name} 平台用户操作流程测试通过`);
    }
  });
});