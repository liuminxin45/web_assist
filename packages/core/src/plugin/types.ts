// 插件类型定义

// 插件元数据
interface PluginMetadata {
  id: string;          // 插件唯一标识符
  name: string;        // 插件名称
  version: string;     // 插件版本
  description?: string;// 插件描述
  author?: string;     // 作者信息
  engines?: {          // 支持的宿主版本
    webHelper?: string;
  };
  main?: string;       // 主入口文件
  contributes?: {      // 插件贡献点
    commands?: Array<{
      command: string; // 命令ID
      title: string;   // 命令标题
      category?: string; // 命令分类
    }>;
    views?: Array<{
      id: string;      // 视图ID
      name: string;    // 视图名称
    }>;
    // 其他贡献点...
  };
}

// 插件上下文
interface PluginContext {
  pluginId: string;
  extensionPath: string;
  subscriptions: { dispose(): void }[];
  commands: {
    registerCommand(id: string, callback: (...args: any[]) => any): { dispose(): void };
    executeCommand(id: string, ...args: any[]): Promise<any>;
  };
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    remove(key: string): Promise<void>;
  };
  messaging: {
    sendMessage(message: any): Promise<any>;
    onMessage(callback: (message: any) => void): { dispose(): void };
  };
}

// 插件激活函数类型
type PluginActivateFunction = (context: PluginContext) => void | Promise<void>;

// 插件停用函数类型
type PluginDeactivateFunction = () => void | Promise<void>;

// 插件导出对象
interface PluginExports {
  activate: PluginActivateFunction;
  deactivate?: PluginDeactivateFunction;
}

// 已加载的插件
interface LoadedPlugin {
  id: string;
  metadata: PluginMetadata;
  exports: PluginExports;
  context: PluginContext;
}

// 插件错误
interface PluginError {
  pluginId: string;
  message: string;
  error: Error;
}

export type {
  PluginMetadata,
  PluginContext,
  PluginActivateFunction,
  PluginDeactivateFunction,
  PluginExports,
  LoadedPlugin,
  PluginError
};