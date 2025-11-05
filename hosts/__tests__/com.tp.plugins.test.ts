// Native Messaging Host单元测试

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
import { ChildProcess } from 'child_process';

// 定义测试消息类型
interface TestMessage {
  jsonrpc: string;
  id: string;
  method: string;
  params: any;
}

// 定义响应类型
interface Response {
  jsonrpc: string;
  id: string;
  result?: any;
  error?: any;
}

describe('Native Messaging Host 功能测试', () => {
  let hostProcess: ChildProcess | null = null;
  
  // 测试消息
  const testMessages: TestMessage[] = [
    {
      jsonrpc: '2.0',
      id: '1',
      method: 'plugin.list',
      params: {}
    },
    {
      jsonrpc: '2.0',
      id: '2',
      method: 'plugin.call',
      params: {
        name: 'hello_world',
        method: 'echo',
        args: { message: 'Test message' }
      }
    },
    {
      jsonrpc: '2.0',
      id: '3',
      method: 'plugin.call',
      params: {
        name: 'hello_world',
        method: 'sum',
        args: { a: 5, b: 3 }
      }
    }
  ];

  // 启动host进程
  function startHostProcess(): ChildProcess {
    const scriptPath = path.join(__dirname, '../com.tp.plugins.js');
    
    console.log(`启动host进程: ${scriptPath}`);
    
    const hostProcess = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 捕获host的标准错误输出（用于调试）
    hostProcess.stderr.on('data', (data) => {
      console.log(`[HOST STDERR]: ${data.toString().trim()}`);
    });
    
    return hostProcess;
  }

  // 发送消息到host（遵循Chrome Native Messaging协议）
  function sendMessageToHost(process: ChildProcess, message: TestMessage): void {
    const messageString = JSON.stringify(message);
    const length = Buffer.byteLength(messageString, 'utf8');
    
    // 创建4字节的长度前缀
    const header = Buffer.alloc(4);
    header.writeUInt32LE(length, 0);
    
    // 发送长度前缀和消息体
    process.stdin.write(header);
    process.stdin.write(messageString);
    
    console.log(`发送消息:`, message);
  }

  // 从host读取响应（遵循Chrome Native Messaging协议）
  function readResponseFromHost(process: ChildProcess): Promise<Response> {
    return new Promise((resolve, reject) => {
      // 读取4字节长度前缀
      const header = Buffer.alloc(4);
      let headerBytesRead = 0;
      
      function readHeader() {
        const bytesRead = process.stdout.read(4 - headerBytesRead);
        if (bytesRead === null) {
          return process.stdout.once('readable', readHeader);
        }
        
        bytesRead.copy(header, headerBytesRead);
        headerBytesRead += bytesRead.length;
        
        if (headerBytesRead === 4) {
          const length = header.readUInt32LE(0);
          readMessageBody(length);
        } else {
          readHeader();
        }
      }
      
      function readMessageBody(length) {
        let body = Buffer.alloc(0);
        
        function readBody() {
          const remaining = length - body.length;
          const bytesRead = process.stdout.read(remaining);
          if (bytesRead === null) {
            return process.stdout.once('readable', readBody);
          }
          
          body = Buffer.concat([body, bytesRead]);
          
          if (body.length === length) {
            try {
              const message = JSON.parse(body.toString('utf8'));
              resolve(message);
            } catch (error) {
              reject(error);
            }
          } else {
            readBody();
          }
        }
        
        readBody();
      }
      
      readHeader();
    });
  }

  // 验证响应
  function validateResponse(request: TestMessage, response: Response): boolean {
    // 检查基本结构
    if (!response || !response.jsonrpc || response.jsonrpc !== '2.0') {
      return false;
    }
    
    // 检查ID匹配
    if (response.id !== request.id) {
      return false;
    }
    
    // 根据请求方法进行特定验证
    if (request.method === 'plugin.list') {
      return Array.isArray(response.result) && response.result.length > 0;
    } else if (request.method === 'plugin.call') {
      if (response.error) {
        return false;
      }
      
      if (request.params.method === 'echo') {
        return response.result && response.result.echo === request.params.args.message;
      } else if (request.params.method === 'sum') {
        const expected = request.params.args.a + request.params.args.b;
        return response.result && response.result.value === expected;
      }
    }
    
    return true;
  }

  // 每个测试前启动host进程
  beforeEach((done) => {
    hostProcess = startHostProcess();
    // 等待host初始化
    setTimeout(done, 1000);
  }, 2000); // 2秒超时

  // 每个测试后关闭host进程
  afterEach(() => {
    if (hostProcess && !hostProcess.killed) {
      hostProcess.kill();
      hostProcess = null;
    }
  });

  // 测试插件列表获取
  it('应该能够获取插件列表', async () => {
    if (!hostProcess) {
      fail('Host process not initialized');
      return;
    }
    
    const message = testMessages[0];
    sendMessageToHost(hostProcess, message);
    
    const response = await readResponseFromHost(hostProcess);
    console.log('收到响应:', response);
    
    expect(validateResponse(message, response)).toBe(true);
    expect(Array.isArray(response.result)).toBe(true);
    expect(response.result.length).toBeGreaterThan(0);
  }, 5000); // 5秒超时

  // 测试hello_world插件的echo方法
  it('应该能够调用hello_world插件的echo方法', async () => {
    if (!hostProcess) {
      fail('Host process not initialized');
      return;
    }
    
    const message = testMessages[1];
    sendMessageToHost(hostProcess, message);
    
    const response = await readResponseFromHost(hostProcess);
    console.log('收到响应:', response);
    
    expect(validateResponse(message, response)).toBe(true);
    expect(response.result.echo).toBe('Test message');
  }, 5000);

  // 测试hello_world插件的sum方法
  it('应该能够调用hello_world插件的sum方法', async () => {
    if (!hostProcess) {
      fail('Host process not initialized');
      return;
    }
    
    const message = testMessages[2];
    sendMessageToHost(hostProcess, message);
    
    const response = await readResponseFromHost(hostProcess);
    console.log('收到响应:', response);
    
    expect(validateResponse(message, response)).toBe(true);
    expect(response.result.value).toBe(8);
  }, 5000);
});