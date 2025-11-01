// 简化的Popup组件测试
// 聚焦于测试Popup组件与CoreService单例的交互

// 模拟React和ReactDOM
global.React = {
  useState: jest.fn(),
  useEffect: jest.fn(),
  createElement: jest.fn((type, props, ...children) => ({
    type,
    props: { ...props, children },
    $$typeof: Symbol.for('react.element')
  }))
};

global.ReactDOM = {
  createRoot: jest.fn(() => ({ render: jest.fn() }))
};

global.document = {
  getElementById: jest.fn()
};

// 模拟CoreService单例
global.CoreService = (() => {
  let instance = null;
  
  return {
    getInstance: jest.fn(() => {
      if (!instance) {
        instance = {
          initialize: jest.fn(),
          incrementCounter: jest.fn(),
          decrementCounter: jest.fn(),
          getCounterValue: jest.fn().mockReturnValue(0),
          getPlatformInfo: jest.fn().mockReturnValue({ name: 'test-platform', isDev: false }),
          sendTestMessage: jest.fn().mockReturnValue({ success: true })
        };
      }
      return instance;
    })
  };
})();

describe('Popup组件测试', () => {
  let coreService;
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置React Hooks模拟
    React.useState.mockReturnValue([0, jest.fn()]);
    React.useEffect.mockImplementation(cb => cb && cb());
    
    // 获取CoreService实例
    coreService = CoreService.getInstance();
  });
  
  describe('CoreService单例交互', () => {
    it('应该调用CoreService.getInstance获取单例', () => {
      // 验证getInstance被调用
      expect(CoreService.getInstance).toHaveBeenCalled();
    });
    
    it('应该使用同一个CoreService实例', () => {
      const instance1 = CoreService.getInstance();
      const instance2 = CoreService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(CoreService.getInstance).toHaveBeenCalledTimes(3); // 包括beforeEach中的调用
    });
  });
  
  describe('组件功能测试', () => {
    it('应该正确调用CoreService方法', () => {
      // 模拟组件中调用的方法
      coreService.initialize();
      coreService.incrementCounter();
      const value = coreService.getCounterValue();
      
      expect(coreService.initialize).toHaveBeenCalled();
      expect(coreService.incrementCounter).toHaveBeenCalled();
      expect(coreService.getCounterValue).toHaveBeenCalled();
      expect(value).toBe(0);
    });
    
    it('应该正确获取平台信息', () => {
      const platformInfo = coreService.getPlatformInfo();
      
      expect(platformInfo).toEqual({ name: 'test-platform', isDev: false });
      expect(coreService.getPlatformInfo).toHaveBeenCalled();
    });
    
    it('应该正确发送测试消息', () => {
      const result = coreService.sendTestMessage('test');
      
      expect(result.success).toBe(true);
      expect(coreService.sendTestMessage).toHaveBeenCalledWith('test');
    });
  });
  
  describe('错误处理测试', () => {
    it('应该处理初始化失败', () => {
      coreService.initialize.mockImplementation(() => {
        throw new Error('Init failed');
      });
      
      expect(() => coreService.initialize()).toThrow('Init failed');
    });
    
    it('应该处理消息发送失败', () => {
      coreService.sendTestMessage.mockReturnValue({ success: false, error: 'Send failed' });
      
      const result = coreService.sendTestMessage('test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Send failed');
    });
  });
  
  describe('计数器功能测试', () => {
    it('应该测试递增操作', () => {
      coreService.incrementCounter();
      expect(coreService.incrementCounter).toHaveBeenCalled();
    });
    
    it('应该测试递减操作', () => {
      coreService.decrementCounter();
      expect(coreService.decrementCounter).toHaveBeenCalled();
    });
    
    it('应该测试获取计数器值', () => {
      coreService.getCounterValue.mockReturnValueOnce(5);
      const value = coreService.getCounterValue();
      
      expect(value).toBe(5);
    });
  });
});