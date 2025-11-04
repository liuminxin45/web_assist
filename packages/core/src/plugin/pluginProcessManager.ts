import { pluginManager } from '../plugin/pluginManager';
import { ipcManager, IpcRequestMessage } from '../ipc/ipcManager';
import { __TARGET__ } from '../../../platform/index';

// 插件进程类型
enum PluginProcessType {
  MAIN = 'main',           // 主进程
  RENDERER = 'renderer',   // 渲染进程
  WORKER = 'worker',       // 工作进程
  EXTENSION = 'extension', // 扩展进程
}

// 插件进程配置
interface PluginProcessConfig {
  processType: PluginProcessType;
  allowPluginExecution?: boolean; // 是否允许在此进程执行插件
  pluginDirectories?: string[];   // 插件目录
  maxWorkerProcesses?: number;    // 最大工作进程数
}

// 插件执行上下文
interface PluginExecutionContext {
  pluginId: string;
  processId: string;
  processType: PluginProcessType;
  startTime: number;
  isActive: boolean;
}

// 插件进程管理器
class PluginProcessManager {
  private processConfig: PluginProcessConfig = {
    processType: PluginProcessType.RENDERER,
    allowPluginExecution: false,
    pluginDirectories: [],
    maxWorkerProcesses: 4
  };
  private activeExecutions: Map<string, PluginExecutionContext> = new Map();
  private workerProcesses: Set<string> = new Set();
  private isInitialized = false;

  // 初始化插件进程管理器
  initialize(config: PluginProcessConfig = { processType: PluginProcessType.MAIN }): void {
    if (this.isInitialized) {
      throw new Error('PluginProcessManager already initialized');
    }

    this.processConfig = {
      allowPluginExecution: true,
      pluginDirectories: ['./plugins'],
      maxWorkerProcesses: 4,
      ...config
    };

    // 初始化IPC管理器
    ipcManager.initialize(this.processConfig.processType);

    // 注册IPC处理器
    this.registerIpcHandlers();

    // 如果允许在此进程执行插件，则初始化插件管理器
    if (this.processConfig.allowPluginExecution) {
      this.initializeLocalPlugins();
    }

    this.isInitialized = true;
    console.log(`PluginProcessManager initialized (type: ${this.processConfig.processType})`);
  }

  // 初始化本地插件
  private async initializeLocalPlugins(): Promise<void> {
    try {
      await pluginManager.initialize(this.processConfig.pluginDirectories!);
      await pluginManager.activateAll();
    } catch (error) {
      console.error('Failed to initialize local plugins:', error);
    }
  }

  // 注册IPC处理器
  private registerIpcHandlers(): void {
    // 注册插件加载处理器
    ipcManager.registerHandler('plugin.load', {
      handle: async (request: IpcRequestMessage) => {
        const { pluginId, pluginPath } = request.payload || {};
        if (!pluginId || !pluginPath) {
          throw new Error('Missing pluginId or pluginPath');
        }
        
        // 这里需要实现跨进程加载插件的逻辑
        // 在实际实现中，可能需要在目标进程中动态导入插件
        throw new Error('Cross-process plugin loading not implemented yet');
      }
    });

    // 注册插件激活处理器
    ipcManager.registerHandler('plugin.activate', {
      handle: async (request: IpcRequestMessage) => {
        const { pluginId } = request.payload || {};
        if (!pluginId) {
          throw new Error('Missing pluginId');
        }

        if (this.processConfig.allowPluginExecution) {
          await pluginManager.activatePlugin(pluginId);
          
          // 记录插件执行上下文
          this.activeExecutions.set(pluginId, {
            pluginId,
            processId: ipcManager.getProcessId(),
            processType: this.processConfig.processType,
            startTime: Date.now(),
            isActive: true
          });
          
          return { success: true };
        }
        throw new Error('Plugin execution not allowed in this process');
      }
    });

    // 注册插件停用处理器
    ipcManager.registerHandler('plugin.deactivate', {
      handle: async (request: IpcRequestMessage) => {
        const { pluginId } = request.payload || {};
        if (!pluginId) {
          throw new Error('Missing pluginId');
        }

        if (this.processConfig.allowPluginExecution) {
          await pluginManager.deactivatePlugin(pluginId);
          this.activeExecutions.delete(pluginId);
          return { success: true };
        }
        throw new Error('Plugin execution not allowed in this process');
      }
    });

    // 注册命令执行处理器
    ipcManager.registerHandler('plugin.executeCommand', {
      handle: async (request: IpcRequestMessage) => {
        const { commandId, args } = request.payload || {};
        if (!commandId) {
          throw new Error('Missing commandId');
        }

        if (this.processConfig.allowPluginExecution) {
          return await pluginManager.executeCommand(commandId, ...(args || []));
        }
        throw new Error('Command execution not allowed in this process');
      }
    });

    // 注册获取插件列表处理器
    ipcManager.registerHandler('plugin.getPlugins', {
      handle: async () => {
        if (this.processConfig.allowPluginExecution) {
          return pluginManager.getPlugins().map(plugin => ({
            id: plugin.id,
            name: plugin.metadata.name,
            version: plugin.metadata.version,
            description: plugin.metadata.description,
            active: this.activeExecutions.has(plugin.id)
          }));
        }
        return [];
      }
    });

    // 注册创建工作进程处理器
    ipcManager.registerHandler('plugin.createWorkerProcess', {
      handle: async () => {
        // 检查是否达到最大工作进程数
        if (this.workerProcesses.size >= this.processConfig.maxWorkerProcesses!) {
          throw new Error('Maximum number of worker processes reached');
        }

        // 创建新的工作进程
        // 在实际实现中，这里需要根据平台创建新进程
        const workerId = await this.createWorkerProcess();
        this.workerProcesses.add(workerId);
        return { workerId };
      }
    });

    // 注册关闭工作进程处理器
    ipcManager.registerHandler('plugin.shutdownWorkerProcess', {
      handle: async (request: IpcRequestMessage) => {
        const { workerId } = request.payload || {};
        if (!workerId || !this.workerProcesses.has(workerId)) {
          throw new Error('Invalid workerId');
        }

        await this.shutdownWorkerProcess(workerId);
        this.workerProcesses.delete(workerId);
        return { success: true };
      }
    });
  }

  // 创建工作进程（平台相关实现）
  private async createWorkerProcess(): Promise<string> {
    // 这里需要根据不同平台实现进程创建逻辑
    // Web平台可能使用Web Worker
    // Electron平台可能使用child_process
    // 浏览器扩展可能使用Service Worker或新标签页
    throw new Error('Worker process creation not implemented for this platform');
  }

  // 关闭工作进程
  private async shutdownWorkerProcess(_workerId: string): Promise<void> {
    // 平台特定实现
    throw new Error('Worker process shutdown not implemented for this platform');
  }

  // 在指定进程中执行插件
  async executePluginInProcess(pluginId: string, targetProcessId: string): Promise<any> {
    try {
      return await ipcManager.sendRequest('plugin.activate', [{ pluginId }], targetProcessId);
    } catch (error) {
      console.error(`Failed to execute plugin ${pluginId} in process ${targetProcessId}:`, error);
      throw error;
    }
  }

  // 跨进程执行命令
  async executeCommandInProcess(commandId: string, args: any[], targetProcessId?: string): Promise<any> {
    try {
      // 如果指定了目标进程，则发送到目标进程执行
      if (targetProcessId) {
        return await ipcManager.sendRequest('plugin.executeCommand', [{ commandId, args }], targetProcessId);
      }
      
      // 否则在本地执行
      return await pluginManager.executeCommand(commandId, ...args);
    } catch (error) {
      console.error(`Failed to execute command ${commandId}:`, error);
      throw error;
    }
  }

  // 获取所有进程中的插件
  async getAllPlugins(): Promise<any[]> {
    const localPlugins = this.processConfig.allowPluginExecution 
      ? pluginManager.getPlugins().map(p => ({ ...p, processId: ipcManager.getProcessId() })) 
      : [];

    // 获取其他进程中的插件（通过IPC）
    // 这里简化处理，实际实现需要向其他进程发送请求
    return localPlugins;
  }

  // 获取活跃的插件执行上下文
  getActiveExecutions(): PluginExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  // 获取工作进程列表
  getWorkerProcesses(): string[] {
    return Array.from(this.workerProcesses);
  }

  // 根据插件ID查找执行进程
  findPluginExecution(pluginId: string): PluginExecutionContext | undefined {
    return this.activeExecutions.get(pluginId);
  }

  // 优雅关闭
  async shutdown(): Promise<void> {
    // 停用所有插件
    if (this.processConfig.allowPluginExecution) {
      await pluginManager.deactivateAll();
    }

    // 关闭所有工作进程
    for (const workerId of this.workerProcesses) {
      try {
        await this.shutdownWorkerProcess(workerId);
      } catch (error) {
        console.error(`Failed to shutdown worker process ${workerId}:`, error);
      }
    }

    this.workerProcesses.clear();
    this.activeExecutions.clear();
    this.isInitialized = false;
  }
}

// 导出单例实例
export const pluginProcessManager = new PluginProcessManager();

// 导出类和类型
export { PluginProcessManager, PluginProcessType };
export type { PluginProcessConfig, PluginExecutionContext };