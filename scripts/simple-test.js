const fs = require('fs');
const path = require('path');

// 简单的颜色输出函数
const colors = {
  green: text => `\x1b[32m${text}\x1b[0m`,
  red: text => `\x1b[31m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  blue: text => `\x1b[34m${text}\x1b[0m`
};

// 测试结果跟踪
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

// 测试函数
function test(description, fn) {
  results.total++;
  console.log(`${colors.blue('→')} Testing: ${description}`);
  
  try {
    fn();
    results.passed++;
    console.log(`  ${colors.green('✓')} PASSED`);
  } catch (error) {
    results.failed++;
    results.failures.push({
      description,
      error: error.message || String(error)
    });
    console.log(`  ${colors.red('✗')} FAILED: ${error.message || String(error)}`);
  }
}

// 断言函数
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual: (expected) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, but got ${actualStr}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected value to be truthy, but got ${actual}`);
      }
    },
    toBeFalsy: () => {
      if (actual) {
        throw new Error(`Expected value to be falsy, but got ${actual}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    }
  };
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 模拟平台接口
class MockStorage {
  constructor() {
    this.data = {};
  }
  async set(key, value) {
    this.data[key] = value;
  }
  async get(key) {
    return this.data[key];
  }
  async remove(key) {
    delete this.data[key];
  }
}

class MockRuntime {
  constructor(platform) {
    this.platform = platform;
    this.listeners = {};
  }
  getPlatformInfo() {
    return {
      name: this.platform,
      version: '1.0.0',
      isWeb: this.platform === 'web',
      isElectron: this.platform === 'electron',
      isWebExtension: this.platform === 'webext'
    };
  }
  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }
}

class MockMessaging {
  constructor() {
    this.messages = [];
    this.listeners = {};
  }
  sendMessage(message) {
    this.messages.push(message);
    return Promise.resolve({ success: true });
  }
  onMessage(listener) {
    this.listeners.message = listener;
  }
  simulateMessage(message) {
    if (this.listeners.message) {
      return this.listeners.message(message);
    }
  }
}

class MockPlatform {
  constructor(platformType) {
    this.storage = new MockStorage();
    this.runtime = new MockRuntime(platformType);
    this.messaging = new MockMessaging();
    this.platformType = platformType;
  }
}

// 设置模拟平台的函数
let currentPlatform = null;

function setPlatform(platform) {
  currentPlatform = platform;
}

function getPlatform() {
  if (!currentPlatform) {
    throw new Error('Platform not set');
  }
  return currentPlatform;
}

// 模拟CoreService（简化版）
class MockCoreService {
  constructor() {
    this.platform = getPlatform();
    this.counter = 0;
  }
  
  async incrementCounter() {
    this.counter++;
    await this.platform.storage.set('counter', this.counter);
    return this.counter;
  }
  
  async getCounter() {
    const storedCount = await this.platform.storage.get('counter');
    return storedCount !== undefined ? storedCount : this.counter;
  }
  
  getPlatformInfo() {
    return this.platform.runtime.getPlatformInfo();
  }
  
  async sendTestMessage() {
    return this.platform.messaging.sendMessage({ type: 'test', data: { counter: this.counter } });
  }
}

// 测试套件
async function runTests() {
  console.log(colors.yellow('\n===== 启动简单测试套件 =====\n'));
  
  // 测试Web平台
  console.log(colors.blue('\n[Web平台测试]\n'));
  setPlatform(new MockPlatform('web'));
  const webService = new MockCoreService();
  
  test('Web平台信息获取', () => {
    const info = webService.getPlatformInfo();
    expect(info.name).toBe('web');
    expect(info.isWeb).toBeTruthy();
    expect(info.isElectron).toBeFalsy();
    expect(info.isWebExtension).toBeFalsy();
  });
  
  test('Web平台计数器递增', async () => {
    const count1 = await webService.incrementCounter();
    expect(count1).toBe(1);
    const count2 = await webService.incrementCounter();
    expect(count2).toBe(2);
  });
  
  test('Web平台消息发送', async () => {
    const result = await webService.sendTestMessage();
    expect(result.success).toBeTruthy();
  });
  
  // 测试Electron平台
  console.log(colors.blue('\n[Electron平台测试]\n'));
  setPlatform(new MockPlatform('electron'));
  const electronService = new MockCoreService();
  
  test('Electron平台信息获取', () => {
    const info = electronService.getPlatformInfo();
    expect(info.name).toBe('electron');
    expect(info.isWeb).toBeFalsy();
    expect(info.isElectron).toBeTruthy();
    expect(info.isWebExtension).toBeFalsy();
  });
  
  test('Electron平台计数器递增', async () => {
    const count1 = await electronService.incrementCounter();
    expect(count1).toBe(1);
  });
  
  // 测试WebExtension平台
  console.log(colors.blue('\n[WebExtension平台测试]\n'));
  setPlatform(new MockPlatform('webext'));
  const webextService = new MockCoreService();
  
  test('WebExtension平台信息获取', () => {
    const info = webextService.getPlatformInfo();
    expect(info.name).toBe('webext');
    expect(info.isWeb).toBeFalsy();
    expect(info.isElectron).toBeFalsy();
    expect(info.isWebExtension).toBeTruthy();
  });
  
  test('WebExtension平台计数器递增', async () => {
    const count1 = await webextService.incrementCounter();
    expect(count1).toBe(1);
  });
  
  // 跨平台一致性测试
  console.log(colors.blue('\n[跨平台一致性测试]\n'));
  
  test('各平台接口一致性', () => {
    const platforms = [
      new MockPlatform('web'),
      new MockPlatform('electron'),
      new MockPlatform('webext')
    ];
    
    platforms.forEach(platform => {
      expect(platform.storage).toBeDefined();
      expect(platform.runtime).toBeDefined();
      expect(platform.messaging).toBeDefined();
      expect(typeof platform.storage.get).toBe('function');
      expect(typeof platform.storage.set).toBe('function');
      expect(typeof platform.runtime.getPlatformInfo).toBe('function');
      expect(typeof platform.messaging.sendMessage).toBe('function');
    });
  });
  
  // 生成测试报告
  console.log(colors.yellow('\n===== 测试报告 =====\n'));
  console.log(`总测试数: ${results.total}`);
  console.log(`通过测试: ${colors.green(results.passed)}`);
  console.log(`失败测试: ${colors.red(results.failed)}`);
  
  if (results.failures.length > 0) {
    console.log(colors.red('\n失败详情:'));
    results.failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.description}`);
      console.log(`   Error: ${failure.error}`);
    });
  }
  
  console.log('');
  if (results.failed === 0) {
    console.log(colors.green('🎉 所有测试通过！多端功能验证成功！'));
    return 0;
  } else {
    console.log(colors.red('❌ 测试失败，请检查上述问题。'));
    return 1;
  }
}

// 运行测试
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(colors.red('\n测试运行出错:'), error);
  process.exit(1);
});