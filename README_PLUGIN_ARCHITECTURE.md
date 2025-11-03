# Chrome Web Helper 插件架构

## 架构概述

本项目实现了一个类似于VS Code的插件系统，基于以下分层架构：

```
[MV3 Extension]  - UI壳 + 权限路由
   ├─ UI：popup页面（React）
   ├─ SW：后台脚本，负责消息路由
   └─ Bridge：与Native Host通信

[Native Host]  - 插件宿主（本地进程）
   ├─ Plugin Manager：插件生命周期管理
   ├─ Process Supervisor：进程监控和管理
   └─ Registry：插件注册表

[Plugins]  - 独立进程插件
   ├─ 每个插件为独立进程
   └─ 通过JSON-RPC协议通信
```

## 已实现功能

1. **插件列表管理**：查看、启用、禁用插件
2. **跨进程通信**：基于Chrome Native Messaging和JSON-RPC
3. **进程隔离**：每个插件在独立进程中运行
4. **动态加载**：支持插件的热插拔
5. **权限控制**：通过Native Host管理插件权限

## 快速开始

### 1. 安装Native Messaging Host

#### Windows 安装

1. 打开注册表编辑器（regedit）
2. 导航到：`HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.tp.plugins`
3. 创建字符串值，数值数据为Native Host配置文件路径：
   ```
   e:\3rd\chrome\web_helper\hosts\com.tp.plugins.json
   ```

#### macOS 安装

1. 创建目录（如果不存在）：
   ```bash
   mkdir -p ~/Library/Application Support/Google/Chrome/NativeMessagingHosts
   ```
2. 创建符号链接：
   ```bash
   ln -s /path/to/web_helper/hosts/com.tp.plugins.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
   ```

#### Linux 安装

1. 创建目录（如果不存在）：
   ```bash
   mkdir -p ~/.config/google-chrome/NativeMessagingHosts
   ```
2. 创建符号链接：
   ```bash
   ln -s /path/to/web_helper/hosts/com.tp.plugins.json ~/.config/google-chrome/NativeMessagingHosts/
   ```

### 2. 配置Native Host

确保 `com.tp.plugins.json` 中的路径配置正确指向 `com.tp.plugins.js` 文件。

对于Windows，路径需要使用双反斜杠：
```json
"path": "e:\\3rd\\chrome\\web_helper\\hosts\\com.tp.plugins.js"
```

### 3. 安装Node.js

Native Host和插件使用Node.js运行，确保已安装Node.js 14+。

### 4. 加载Chrome扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions`
3. 启用开发者模式
4. 点击"加载已解压的扩展程序"
5. 选择 `e:\3rd\chrome\web_helper\apps\extension` 目录

## 使用方法

### 查看插件列表

1. 点击扩展图标打开popup页面
2. 查看已安装的插件列表
3. 检查Native Host连接状态（绿色表示已连接）

### 启用/禁用插件

1. 在插件列表中，点击对应的"Enable"或"Disable"按钮
2. 插件状态会实时更新

### 测试插件

1. 确保插件已启用
2. 点击"Test"按钮发送测试请求
3. 查看插件返回的响应结果

## 开发新插件

### 插件目录结构

每个插件需要以下文件：

```
plugins/
  your_plugin_name/
    ├─ plugin.json       # 插件配置
    └─ index.js          # 插件入口文件
```

### plugin.json 格式

```json
{
  "name": "plugin_name",
  "version": "1.0.0",
  "entry": "node index.js",
  "permissions": ["fs.read", "net", "process"],
  "capabilities": ["method1", "method2"],
  "os": ["win32", "linux", "darwin"],
  "arch": ["x64", "arm64"]
}
```

### 插件开发示例

```javascript
// index.js
console.log('Plugin started');

process.stdin.on('data', (buf) => {
  try {
    const data = buf.toString();
    const lines = data.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const msg = JSON.parse(line);
        
        // 处理初始化消息
        if (msg.type === 'INITIALIZE') {
          console.log('Initialized with:', msg.pluginInfo);
          return;
        }
        
        // 处理JSON-RPC请求
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
    case 'your_method':
      // 实现你的方法逻辑
      result = { success: true, data: msg.params };
      break;
      
    default:
      sendError(msg.id, `Method ${msg.method} not implemented`);
      return;
  }
  
  sendResponse(msg.id, result);
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id,
    result
  }) + '\n');
}

function sendError(id, message) {
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message
    }
  }) + '\n');
}
```

## 调试指南

### 调试扩展

1. 使用Chrome DevTools调试popup页面
2. 在扩展管理页面点击"检查视图"调试background script

### 调试Native Host

1. 修改 `com.tp.plugins.js` 添加更多日志输出
2. 将输出重定向到文件进行分析

### 调试插件

1. 每个插件进程的stdout/stderr会被Native Host捕获
2. 在Native Host日志中可以看到插件的输出

## 安全注意事项

1. **权限管理**：插件权限应最小化，仅授予必要权限
2. **路径安全**：避免插件访问敏感系统路径
3. **输入验证**：所有来自扩展或其他插件的输入都需要验证
4. **通信加密**：生产环境应考虑加密通信内容

## 已知限制

1. Native Host需要单独安装，不随扩展自动安装
2. 插件进程崩溃可能需要手动重启
3. 大型插件可能有性能开销

## 后续改进方向

1. 实现插件安装/卸载/升级功能
2. 添加插件签名验证机制
3. 实现插件市场功能
4. 增强监控和诊断能力
5. 添加更多安全措施

## 故障排除

### Native Host 连接失败

1. 检查注册表配置是否正确
2. 验证Node.js是否正确安装
3. 检查文件路径是否正确
4. 查看Native Host日志获取详细错误信息

### 插件不响应

1. 确认插件已启用
2. 检查插件进程是否正常运行
3. 验证插件实现是否正确处理JSON-RPC请求

### 性能问题

1. 减少插件数量
2. 优化插件实现，避免阻塞操作
3. 考虑使用更高效的进程间通信方式

---

## 相关文件

- **扩展侧**：
  - `apps/extension/manifest.json` - 扩展配置
  - `apps/extension/background.ts` - 后台脚本和通信桥接
  - `apps/extension/src/popup.tsx` - UI界面
  - `packages/core/index.ts` - 核心服务

- **Native Host**：
  - `hosts/com.tp.plugins.js` - Native Host实现
  - `hosts/com.tp.plugins.json` - Native Host配置

- **示例插件**：
  - `hosts/plugins/hello_world/` - Hello World插件
  - `hosts/plugins/file_utils/` - 文件工具插件

---

© 2023 Chrome Web Helper Plugin System