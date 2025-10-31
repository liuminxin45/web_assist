import { platform } from '@platform/index';

// 核心服务类
export class CoreService {
  private counter: number = 0;
  private static instance: CoreService;

  // 单例模式
  public static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  // 初始化核心服务
  async initialize(): Promise<void> {
    try {
      // 从存储中加载计数器值
      const savedCounter = await platform.storage.get('counter');
      if (savedCounter !== null) {
        this.counter = savedCounter;
      }
      console.log(`CoreService initialized on ${platform.name}`);
    } catch (error) {
      console.error('Error initializing CoreService:', error);
    }
  }

  // 增加计数器
  async incrementCounter(): Promise<number> {
    this.counter++;
    await this.saveCounter();
    return this.counter;
  }

  // 减少计数器
  async decrementCounter(): Promise<number> {
    if (this.counter > 0) {
      this.counter--;
      await this.saveCounter();
    }
    return this.counter;
  }

  // 获取当前计数值
  getCounter(): number {
    return this.counter;
  }

  // 保存计数器到存储
  private async saveCounter(): Promise<void> {
    try {
      await platform.storage.set('counter', this.counter);
    } catch (error) {
      console.error('Error saving counter:', error);
    }
  }

  // 获取平台信息
  getPlatformInfo() {
    return {
      name: platform.name,
      version: platform.runtime.getVersion(),
      isDev: platform.runtime.isDevMode(),
      platformDetails: platform.runtime.getPlatformInfo(),
    };
  }

  // 发送消息
  async sendTestMessage(): Promise<any> {
    try {
      const response = await platform.messaging.sendMessage({
        type: 'TEST_MESSAGE',
        payload: {
          timestamp: Date.now(),
          counter: this.counter,
        },
      });
      return response;
    } catch (error) {
      console.error('Error sending test message:', error);
      return { error: String(error) };
    }
  }
}

// 导出工具函数
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function getAppInfo() {
  return {
    name: 'Web Helper',
    version: '1.0.0',
    description: 'Multi-platform minimal skeleton application',
  };
}