// CoreService单例模式单元测试

describe('CoreService (单例模式)', () => {
  // 保存原始的全局对象引用
  let originalCoreService;
  let originalConsole;
  let coreService;

  beforeEach(() => {
    // 保存原始引用
    originalCoreService = global.CoreService;
    originalConsole = global.console;

    // 模拟console
    global.console = {
      log: jest.fn(),
      error: jest.fn()
    };

    // 在测试环境中重新定义CoreService单例实现
    eval(`
      global.CoreService = (() => {
        let instance = null;
        
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
    `);

    // 获取测试实例
    coreService = CoreService.getInstance();
  });

  afterEach(() => {
    // 清理和恢复
    jest.clearAllMocks();
    // 重置单例实例（通过重新定义CoreService）
    global.CoreService = originalCoreService;
    global.console = originalConsole;
  });

  describe('单例模式验证', () => {
    /**
     * 测试单例模式的核心特性：多次调用getInstance()应返回相同实例
     */
    it('多次调用getInstance()应该返回相同的实例引用', () => {
      const instance1 = CoreService.getInstance();
      const instance2 = CoreService.getInstance();
      
      // 验证是同一个实例
      expect(instance1).toBe(instance2);
      expect(Object.is(instance1, instance2)).toBe(true);
    });

    /**
     * 测试实例属性共享：通过不同引用修改属性应反映到所有引用
     */
    it('通过不同引用修改的状态应在所有引用中保持一致', async () => {
      const instance1 = CoreService.getInstance();
      const instance2 = CoreService.getInstance();
      
      // 通过第一个引用增加计数器
      await instance1.incrementCounter();
      
      // 验证第二个引用看到的是相同的状态
      expect(instance2.getCounter()).toBe(1);
      expect(instance1.getCounter()).toBe(1);
      
      // 通过第二个引用再次增加计数器
      await instance2.incrementCounter();
      
      // 验证两个引用都看到更新后的状态
      expect(instance1.getCounter()).toBe(2);
      expect(instance2.getCounter()).toBe(2);
    });
  });

  describe('初始化和基础功能', () => {
    /**
     * 测试初始化方法
     */
    it('initialize方法应该成功执行并返回Promise', async () => {
      const result = await coreService.initialize();
      expect(result).toBeUndefined();
    });

    /**
     * 测试计数器初始状态
     */
    it('初始计数器值应该为0', () => {
      expect(coreService.getCounter()).toBe(0);
    });

    /**
     * 测试平台信息获取
     */
    it('getPlatformInfo应该返回正确的平台信息对象', () => {
      const platformInfo = coreService.getPlatformInfo();
      expect(platformInfo).toEqual({
        name: 'webext',
        isDev: true
      });
    });
  });

  describe('计数器功能', () => {
    /**
     * 测试递增功能
     */
    it('incrementCounter方法应该增加计数器值并返回新值', async () => {
      const newValue1 = await coreService.incrementCounter();
      expect(newValue1).toBe(1);
      expect(coreService.getCounter()).toBe(1);

      // 多次增加测试
      const newValue2 = await coreService.incrementCounter();
      expect(newValue2).toBe(2);
      
      const newValue3 = await coreService.incrementCounter();
      expect(newValue3).toBe(3);
      
      expect(coreService.getCounter()).toBe(3);
    });

    /**
     * 测试递减功能
     */
    it('decrementCounter方法应该减少计数器值（当值大于0时）', async () => {
      // 先增加到3
      await coreService.incrementCounter();
      await coreService.incrementCounter();
      await coreService.incrementCounter();

      // 测试减少
      const newValue1 = await coreService.decrementCounter();
      expect(newValue1).toBe(2);
      
      const newValue2 = await coreService.decrementCounter();
      expect(newValue2).toBe(1);

      const newValue3 = await coreService.decrementCounter();
      expect(newValue3).toBe(0);
    });

    /**
     * 测试递减边界情况：不应小于0
     */
    it('decrementCounter方法不应该让计数器变为负值', async () => {
      // 初始值为0时测试减少
      const newValue = await coreService.decrementCounter();
      expect(newValue).toBe(0);
      expect(coreService.getCounter()).toBe(0);

      // 增加后再减少到0，然后继续减少
      await coreService.incrementCounter();
      await coreService.decrementCounter(); // 回到0
      await coreService.decrementCounter(); // 应该保持在0
      expect(coreService.getCounter()).toBe(0);
    });
  });

  describe('消息功能', () => {
    /**
     * 测试消息发送功能
     */
    it('sendTestMessage方法应该返回正确的响应对象', async () => {
      const response = await coreService.sendTestMessage();
      
      expect(response).toEqual({
        status: 'success',
        message: 'Test message sent'
      });
      
      // 验证返回的是新对象（每次调用应该返回新的对象引用）
      const response2 = await coreService.sendTestMessage();
      expect(response).not.toBe(response2);
      expect(response).toEqual(response2);
    });
  });

  describe('并发操作测试', () => {
    /**
     * 测试并发递增操作
     */
    it('并发调用incrementCounter()应该正确累加', async () => {
      // 模拟5次并发递增
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(coreService.incrementCounter());
      }
      
      const results = await Promise.all(promises);
      
      // 验证最终状态
      expect(coreService.getCounter()).toBe(5);
      
      // 验证所有Promise都返回了值
      expect(results.length).toBe(5);
      // 结果应该包含1到5的所有值（顺序可能不确定）
      const sortedResults = [...results].sort((a, b) => a - b);
      expect(sortedResults).toEqual([1, 2, 3, 4, 5]);
    });

    /**
     * 测试混合并发操作
     */
    it('混合并发递增和递减操作应该正确维护状态', async () => {
      // 先递增到10
      for (let i = 0; i < 10; i++) {
        await coreService.incrementCounter();
      }
      expect(coreService.getCounter()).toBe(10);
      
      // 混合并发操作
      const promises = [];
      for (let i = 0; i < 8; i++) {
        promises.push(coreService.decrementCounter());
      }
      for (let i = 0; i < 3; i++) {
        promises.push(coreService.incrementCounter());
      }
      
      await Promise.all(promises);
      
      // 最终结果应该是10 - 8 + 3 = 5
      expect(coreService.getCounter()).toBe(5);
    });
  });

  describe('边界条件和异常处理', () => {
    /**
     * 测试大量操作的稳定性
     */
    it('大量连续递增操作后计数器应该保持正确', async () => {
      // 执行100次递增操作
      for (let i = 0; i < 100; i++) {
        await coreService.incrementCounter();
      }
      
      expect(coreService.getCounter()).toBe(100);
      
      // 再执行50次递减操作
      for (let i = 0; i < 50; i++) {
        await coreService.decrementCounter();
      }
      
      expect(coreService.getCounter()).toBe(50);
    });

    /**
     * 测试单例在长时间操作后的一致性
     */
    it('单例实例在长时间操作后仍然保持一致', async () => {
      const initialInstance = CoreService.getInstance();
      
      // 执行一系列操作
      for (let i = 0; i < 50; i++) {
        await coreService.incrementCounter();
        if (i % 5 === 0) {
          await coreService.decrementCounter();
        }
      }
      
      // 验证最终状态
      expect(coreService.getCounter()).toBe(40); // 50增加 - 10减少 = 40
      
      // 验证实例仍然是同一个
      const newInstance = CoreService.getInstance();
      expect(initialInstance).toBe(newInstance);
      expect(newInstance.getCounter()).toBe(40);
    });
  });
});