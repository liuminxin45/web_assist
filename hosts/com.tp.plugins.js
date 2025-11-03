#!/usr/bin/env node
// Native Messaging Host for Chrome Extension Plugin Architecture
// This is a reference implementation for the plugin host

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 插件目录和状态管理
const PLUGINS_DIR = path.join(__dirname, 'plugins');
const registry = new Map(); // name -> plugin metadata
const procs = new Map();    // name -> child process
const pendingRequests = new Map(); // requestId -> callback
let requestIdCounter = 0;

// 模拟的插件数据（实际应用中应从文件系统加载）
const mockPlugins = [
  {
    name: 'hello_world',
    version: '1.0.0',
    enabled: true,
    capabilities: ['echo', 'sum'],
    entry: 'node index.js',
    dir: path.join(PLUGINS_DIR, 'hello_world')
  },
  {
    name: 'file_utils',
    version: '0.1.0',
    enabled: false,
    capabilities: ['file.read', 'file.list'],
    entry: 'node index.js',
    dir: path.join(PLUGINS_DIR, 'file_utils')
  }
];

// 初始化插件注册表
function initializeRegistry() {
  console.log(`Initializing plugin registry from ${PLUGINS_DIR}`);
  
  // 确保插件目录存在
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    console.log(`Created plugins directory: ${PLUGINS_DIR}`);
  }
  
  // 在实际应用中，这里应该扫描目录并加载plugin.json文件
  // 这里使用模拟数据作为演示
  mockPlugins.forEach(plugin => {
    registry.set(plugin.name, plugin);
    
    // 如果插件已启用，启动它
    if (plugin.enabled) {
      startPlugin(plugin.name).catch(err => {
        console.error(`Failed to start plugin ${plugin.name}:`, err);
      });
    }
  });
}

// 启动插件进程
async function startPlugin(name) {
  const plugin = registry.get(name);
  if (!plugin) {
    throw new Error(`Plugin ${name} not found`);
  }
  
  if (procs.has(name)) {
    console.log(`Plugin ${name} is already running`);
    return;
  }
  
  console.log(`Starting plugin: ${name}`);
  
  // 确保插件目录存在
  if (!fs.existsSync(plugin.dir)) {
    fs.mkdirSync(plugin.dir, { recursive: true });
    
    // 创建简单的插件实现作为演示
    createMockPlugin(plugin);
  }
  
  try {
    // 解析入口命令
    const [cmd, ...args] = plugin.entry.split(' ');
    
    // 启动子进程
    const child = spawn(cmd, args, {
      cwd: plugin.dir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 设置进程通信
    child.stdout.on('data', (data) => {
      handlePluginOutput(name, data);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`Plugin ${name} stderr:`, data.toString());
    });
    
    child.on('close', (code) => {
      console.log(`Plugin ${name} process exited with code ${code}`);
      procs.delete(name);
      
      // 如果插件应该是启用的，尝试重启它
      const currentPlugin = registry.get(name);
      if (currentPlugin && currentPlugin.enabled) {
        console.log(`Attempting to restart plugin ${name}...`);
        setTimeout(() => startPlugin(name), 1000);
      }
    });
    
    child.on('error', (err) => {
      console.error(`Error with plugin ${name}:`, err);
      procs.delete(name);
    });
    
    // 保存进程引用
    procs.set(name, child);
    console.log(`Plugin ${name} started successfully`);
    
    // 发送初始化消息给插件
    sendToPlugin(name, {
      type: 'INITIALIZE',
      pluginInfo: plugin
    });
    
  } catch (error) {
    console.error(`Failed to start plugin ${name}:`, error);
    throw error;
  }
}

// 停止插件进程
function stopPlugin(name) {
  const child = procs.get(name);
  if (child) {
    console.log(`Stopping plugin: ${name}`);
    child.kill();
    procs.delete(name);
  }
  
  // 更新插件状态
  const plugin = registry.get(name);
  if (plugin) {
    plugin.enabled = false;
  }
}

// 向插件发送消息
function sendToPlugin(name, message) {
  const child = procs.get(name);
  if (child && child.stdin.writable) {
    const data = JSON.stringify(message) + '\n';
    child.stdin.write(data);
  } else {
    console.error(`Cannot send message to plugin ${name}: process not available`);
  }
}

// 处理插件输出
function handlePluginOutput(name, data) {
  try {
    const output = data.toString();
    const lines = output.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const message = JSON.parse(line);
        
        // 处理JSON-RPC响应
        if (message.jsonrpc === '2.0' && message.id) {
          const callback = pendingRequests.get(message.id);
          if (callback) {
            callback(message);
            pendingRequests.delete(message.id);
          }
        } else {
          // 处理其他类型的消息
          console.log(`Received from plugin ${name}:`, message);
        }
      } catch (error) {
        console.error(`Failed to parse output from plugin ${name}:`, error);
        console.error(`Raw output: ${line}`);
      }
    });
  } catch (error) {
    console.error(`Error handling output from plugin ${name}:`, error);
  }
}

// 调用插件方法
async function callPlugin(name, method, params) {
  if (!procs.has(name)) {
    throw new Error(`Plugin ${name} is not running`);
  }
  
  const requestId = (requestIdCounter++).toString();
  
  return new Promise((resolve, reject) => {
    // 设置超时
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Call to plugin ${name}.${method} timed out`));
    }, 30000); // 30秒超时
    
    // 保存回调
    pendingRequests.set(requestId, (response) => {
      clearTimeout(timeoutId);
      
      if (response.error) {
        reject(new Error(response.error.message || 'Plugin returned an error'));
      } else {
        resolve(response.result);
      }
    });
    
    // 发送请求
    sendToPlugin(name, {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    });
  });
}

// 创建模拟插件文件
function createMockPlugin(plugin) {
  const indexPath = path.join(plugin.dir, 'index.js');
  
  // 根据插件名创建不同的实现
  let pluginCode = '';
  
  if (plugin.name === 'hello_world') {
    pluginCode = `
// Hello World Plugin
console.log('Hello World plugin started');

process.stdin.on('data', (buf) => {
  try {
    const data = buf.toString();
    const lines = data.split('\\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const msg = JSON.parse(line);
        
        if (msg.type === 'INITIALIZE') {
          console.log('Plugin initialized with info:', msg.pluginInfo);
          return;
        }
        
        if (msg.jsonrpc === '2.0' && msg.method) {
          handleMethod(msg);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
  } catch (e) {
    console.error('Error processing input:', e);
  }
});

function handleMethod(msg) {
  let result;
  
  switch (msg.method) {
    case 'echo':
      result = { echo: msg.params?.message || 'No message provided' };
      break;
      
    case 'sum':
      result = { 
        value: (msg.params?.a || 0) + (msg.params?.b || 0),
        a: msg.params?.a || 0,
        b: msg.params?.b || 0
      };
      break;
      
    default:
      sendError(msg.id, `Method ${msg.method} not implemented`);
      return;
  }
  
  sendResponse(msg.id, result);
}

function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id,
    result
  };
  
  process.stdout.write(JSON.stringify(response) + '\\n');
}

function sendError(id, message) {
  const error = {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message
    }
  };
  
  process.stdout.write(JSON.stringify(error) + '\\n');
}

// 优雅退出
process.on('SIGTERM', () => {
  console.log('Plugin shutting down');
  process.exit(0);
});
`;
  } else if (plugin.name === 'file_utils') {
    pluginCode = `
// File Utils Plugin
const fs = require('fs');
const path = require('path');

console.log('File Utils plugin started');

process.stdin.on('data', (buf) => {
  try {
    const data = buf.toString();
    const lines = data.split('\\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const msg = JSON.parse(line);
        
        if (msg.type === 'INITIALIZE') {
          console.log('Plugin initialized with info:', msg.pluginInfo);
          return;
        }
        
        if (msg.jsonrpc === '2.0' && msg.method) {
          handleMethod(msg);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
  } catch (e) {
    console.error('Error processing input:', e);
  }
});

async function handleMethod(msg) {
  try {
    let result;
    
    switch (msg.method) {
      case 'file.read':
        if (!msg.params?.path) {
          throw new Error('File path is required');
        }
        result = await readFile(msg.params.path);
        break;
        
      case 'file.list':
        if (!msg.params?.path) {
          throw new Error('Directory path is required');
        }
        result = await listFiles(msg.params.path);
        break;
        
      default:
        throw new Error(`Method ${msg.method} not implemented`);
    }
    
    sendResponse(msg.id, result);
  } catch (error) {
    sendError(msg.id, error.message);
  }
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(new Error(`Failed to read file: ${err.message}`));
      } else {
        resolve({ content: data, path: filePath });
      }
    });
  });
}

function listFiles(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
      if (err) {
        reject(new Error(`Failed to list directory: ${err.message}`));
      } else {
        resolve(entries.map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(dirPath, entry.name)
        })));
      }
    });
  });
}

function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id,
    result
  };
  
  process.stdout.write(JSON.stringify(response) + '\\n');
}

function sendError(id, message) {
  const error = {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32603,
      message
    }
  };
  
  process.stdout.write(JSON.stringify(error) + '\\n');
}

// 优雅退出
process.on('SIGTERM', () => {
  console.log('Plugin shutting down');
  process.exit(0);
});
`;
  }
  
  // 写入插件代码
  fs.writeFileSync(indexPath, pluginCode.trim());
  console.log(`Created mock plugin at ${indexPath}`);
  
  // 创建plugin.json文件
  const pluginJsonPath = path.join(plugin.dir, 'plugin.json');
  const pluginJson = {
    name: plugin.name,
    version: plugin.version,
    entry: plugin.entry,
    permissions: ['fs.read', 'process'],
    capabilities: plugin.capabilities,
    os: ['win32', 'linux', 'darwin'],
    arch: ['x64', 'arm64']
  };
  
  fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2));
  console.log(`Created plugin.json at ${pluginJsonPath}`);
}

// 处理来自Chrome扩展的消息
function handleMessage(message) {
  console.log('Received message from extension:', message);
  
  // 处理JSON-RPC请求
  if (message.jsonrpc === '2.0' && message.method) {
    handleRpcRequest(message);
  } else {
    // 处理非RPC消息
    console.log('Unknown message type:', message);
    sendToExtension({
      error: 'Unknown message format'
    });
  }
}

// 处理RPC请求
async function handleRpcRequest(request) {
  try {
    const { method, params, id } = request;
    let result;
    
    if (method.startsWith('plugin.')) {
      const pluginMethod = method.substring('plugin.'.length);
      
      switch (pluginMethod) {
        case 'list':
          result = Array.from(registry.values()).map(p => ({
            name: p.name,
            version: p.version,
            enabled: p.enabled,
            capabilities: p.capabilities
          }));
          break;
          
        case 'enable':
          if (!params?.name) {
            throw new Error('Plugin name is required');
          }
          await startPlugin(params.name);
          const pluginToEnable = registry.get(params.name);
          if (pluginToEnable) {
            pluginToEnable.enabled = true;
          }
          result = { success: true, name: params.name };
          break;
          
        case 'disable':
          if (!params?.name) {
            throw new Error('Plugin name is required');
          }
          stopPlugin(params.name);
          result = { success: true, name: params.name };
          break;
          
        case 'call':
          if (!params?.name || !params?.method) {
            throw new Error('Plugin name and method are required');
          }
          result = await callPlugin(params.name, params.method, params.args || {});
          break;
          
        default:
          throw new Error(`Plugin method ${pluginMethod} not implemented`);
      }
    } else {
      throw new Error(`Method ${method} not implemented`);
    }
    
    // 发送成功响应
    sendToExtension({
      jsonrpc: '2.0',
      id,
      result
    });
    
  } catch (error) {
    console.error('Error handling RPC request:', error);
    
    // 发送错误响应
    sendToExtension({
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32000,
        message: error.message
      }
    });
  }
}

// 发送消息到Chrome扩展
function sendToExtension(message) {
  const data = JSON.stringify(message);
  
  // Chrome Native Messaging协议要求消息长度前缀
  const length = Buffer.byteLength(data, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(length, 0);
  
  // 写入消息头和消息体
  process.stdout.write(header);
  process.stdout.write(data);
}

// 从Chrome扩展读取消息
function readFromExtension() {
  // 首先读取4字节的消息长度
  const header = Buffer.alloc(4);
  let headerBytesRead = 0;
  
  function readHeader() {
    const bytesRead = process.stdin.read(4 - headerBytesRead);
    if (bytesRead === null) {
      // 没有足够的数据可读，等待更多数据
      return process.stdin.once('readable', readHeader);
    }
    
    bytesRead.copy(header, headerBytesRead);
    headerBytesRead += bytesRead.length;
    
    if (headerBytesRead === 4) {
      // 已读取完整的消息长度
      const length = header.readUInt32LE(0);
      readMessageBody(length);
    } else {
      // 继续读取消息头
      readHeader();
    }
  }
  
  function readMessageBody(length) {
    const body = Buffer.alloc(length);
    let bodyBytesRead = 0;
    
    function readBody() {
      const bytesRead = process.stdin.read(length - bodyBytesRead);
      if (bytesRead === null) {
        // 没有足够的数据可读，等待更多数据
        return process.stdin.once('readable', readBody);
      }
      
      bytesRead.copy(body, bodyBytesRead);
      bodyBytesRead += bytesRead.length;
      
      if (bodyBytesRead === length) {
        // 已读取完整的消息体
        try {
          const message = JSON.parse(body.toString('utf8'));
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing message from extension:', error);
        }
        
        // 继续读取下一条消息
        headerBytesRead = 0;
        readHeader();
      } else {
        // 继续读取消息体
        readBody();
      }
    }
    
    readBody();
  }
  
  // 开始读取过程
  process.stdin.once('readable', readHeader);
}

// 初始化并启动host
function startHost() {
  console.log('Starting Native Messaging Host: com.tp.plugins');
  
  // 设置编码
  process.stdin.setEncoding('utf8');
  
  // 初始化插件注册表
  initializeRegistry();
  
  // 开始读取来自扩展的消息
  readFromExtension();
  
  // 处理进程信号
  process.on('SIGINT', () => {
    console.log('Host shutting down (SIGINT)');
    cleanup();
  });
  
  process.on('SIGTERM', () => {
    console.log('Host shutting down (SIGTERM)');
    cleanup();
  });
  
  process.on('exit', () => {
    console.log('Host process exiting');
  });
}

// 清理资源
function cleanup() {
  // 停止所有插件进程
  for (const name of procs.keys()) {
    stopPlugin(name);
  }
  
  // 退出进程
  process.exit(0);
}

// 启动host
startHost();

// 导出模块（用于测试）
if (require.main !== module) {
  module.exports = {
    startHost,
    initializeRegistry,
    handleMessage
  };
}