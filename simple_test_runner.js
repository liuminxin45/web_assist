// 简单的测试运行器
const fs = require('fs');
const path = require('path');

// 定义测试结果对象
let testResults = { passed: 0, failures: 0 };

// 定义核心服务模拟类
class CoreServiceMock {
  constructor() {
    this.counter = 0;
    this.platformInfo = {
      name: 'webext',
      version: '1.0.0',
      environment: 'browser extension'
    };
  }

  getCounter() {
    return this.counter;
  }

  incrementCounter() {
    this.counter++;
    return Promise.resolve(this.counter);
  }

  decrementCounter() {
    if (this.counter > 0) {
      this.counter--;
    }
    return Promise.resolve(this.counter);
  }

  getPlatformInfo() {
    return this.platformInfo;
  }

  async initialize() {
    // 模拟初始化
    console.log('Extension initialized');
    return Promise.resolve();
  }
}

// 测试辅助函数
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`期望 ${expected}，但得到 ${actual}`);
      }
      return true;
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`期望 ${JSON.stringify(expected)}，但得到 ${JSON.stringify(actual)}`);
      }
      return true;
    },
    toBeInstanceOf: (constructor) => {
      if (!(actual instanceof constructor)) {
        throw new Error(`期望是 ${constructor.name} 的实例，但不是`);
      }
      return true;
    }
  };
}

function describe(name, fn) {
  console.log(`\n=== 测试套件: ${name} ===`);
  try {
    fn();
  } catch (error) {
    console.log(`❌ 测试套件失败: ${error.message}`);
    testResults.failures += 1;
  }
}

function it(name, fn) {
  console.log(`测试: ${name}`);
  try {
    // 处理异步测试
    if (fn.constructor.name === 'AsyncFunction') {
      fn().then(() => {
        console.log('✅ 通过');
        testResults.passed += 1;
        checkIfAllTestsCompleted();
      }).catch(error => {
        console.log(`❌ 失败: ${error.message}`);
        testResults.failures += 1;
        console.log('测试运行中断，出现错误:', error);
      });
      return; // 异步测试需要单独处理
    }
    fn();
    console.log('✅ 通过');
    testResults.passed += 1;
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    testResults.failures += 1;
  }
}

let totalTests = 0;
let completedTests = 0;

function checkIfAllTestsCompleted() {
  completedTests++;
  if (completedTests >= totalTests) {
    printTestReport();
  }
}

function printTestReport() {
  console.log('\n\n=== 测试报告 ===');
  console.log(`总测试数: ${testResults.passed + testResults.failures}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failures}`);
  console.log(`通过率: ${((testResults.passed / (testResults.passed + testResults.failures)) * 100).toFixed(2)}%`);
}

// 开始测试
console.log('开始执行单元测试...');

// 同步测试
const syncTests = async () => {
  describe('CoreServiceMock', () => {
    let coreService;

    describe('构造函数和初始状态', () => {
      it('应该正确初始化计数器为0', () => {
        coreService = new CoreServiceMock();
        expect(coreService.counter).toBe(0);
        expect(coreService.getCounter()).toBe(0);
      });

      it('应该正确初始化平台信息', () => {
        coreService = new CoreServiceMock();
        const platformInfo = coreService.getPlatformInfo();
        expect(platformInfo).toEqual({
          name: 'webext',
          version: '1.0.0',
          environment: 'browser extension'
        });
      });
    });

    describe('initialize方法', () => {
      // 使用同步版本测试返回Promise
      it('应该返回一个Promise', () => {
        coreService = new CoreServiceMock();
        const result = coreService.initialize();
        expect(result instanceof Promise).toBe(true);
      });
    });

    describe('计数器功能', () => {
      // 使用同步测试
      it('计数器初始值应该为0', () => {
        coreService = new CoreServiceMock();
        expect(coreService.getCounter()).toBe(0);
      });
    });
  });
};

// 异步测试
const runAsyncTests = async () => {
  try {
    console.log('\n执行异步测试...');
    
    // 测试initialize方法
    console.log('测试: initialize方法应该成功初始化');
    let coreService = new CoreServiceMock();
    await coreService.initialize();
    console.log('✅ 通过');
    testResults.passed++;
    
    // 测试incrementCounter方法
    console.log('测试: incrementCounter方法应该增加计数器值并返回新值');
    coreService = new CoreServiceMock();
    const newValue1 = await coreService.incrementCounter();
    if (newValue1 === 1 && coreService.getCounter() === 1) {
      console.log('✅ 通过');
      testResults.passed++;
    } else {
      console.log(`❌ 失败: 期望 1，但得到 ${newValue1}`);
      testResults.failures++;
    }
    
    // 测试多次incrementCounter
    console.log('测试: 多次incrementCounter应该正确累计');
    coreService = new CoreServiceMock();
    await coreService.incrementCounter();
    await coreService.incrementCounter();
    if (coreService.getCounter() === 2) {
      console.log('✅ 通过');
      testResults.passed++;
    } else {
      console.log(`❌ 失败: 期望 2，但得到 ${coreService.getCounter()}`);
      testResults.failures++;
    }
    
    // 测试decrementCounter方法
    console.log('测试: decrementCounter方法应该减少计数器值并返回新值');
    coreService = new CoreServiceMock();
    await coreService.incrementCounter(); // 设置为1
    const newValue2 = await coreService.decrementCounter();
    if (newValue2 === 0 && coreService.getCounter() === 0) {
      console.log('✅ 通过');
      testResults.passed++;
    } else {
      console.log(`❌ 失败: 期望 0，但得到 ${newValue2}`);
      testResults.failures++;
    }
    
    // 测试decrementCounter不小于0
    console.log('测试: decrementCounter方法不应使计数器小于0');
    coreService = new CoreServiceMock();
    const newValue3 = await coreService.decrementCounter();
    if (newValue3 === 0 && coreService.getCounter() === 0) {
      console.log('✅ 通过');
      testResults.passed++;
    } else {
      console.log(`❌ 失败: 期望 0，但得到 ${newValue3}`);
      testResults.failures++;
    }
    
    // 打印最终测试报告
    printTestReport();
    
  } catch (error) {
    console.log(`❌ 异步测试执行出错: ${error.message}`);
    testResults.failures++;
    printTestReport();
  }
};

// 运行测试
syncTests().then(runAsyncTests);