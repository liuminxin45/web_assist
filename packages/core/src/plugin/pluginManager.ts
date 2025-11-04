import { PluginMetadata, PluginExports, LoadedPlugin, PluginContext, PluginError } from './types';
import { platform } from '../../../platform/index';

// 插件管理器
class PluginManager {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private pluginPaths: string[] = [];
  private commands: Map<string, (...args: any[]) => any> = new Map();
  private pluginErrors: PluginError[] = [];
  private isInitialized = false;

  // 初始化插件管理器
  async initialize(pluginDirectories: string[] = ['./plugins']): Promise<void> {
    if (this.isInitialized) {
      throw new Error('PluginManager already initialized');
    }

    this.pluginPaths = pluginDirectories;
    await this.discoverPlugins();
    this.isInitialized = true;
    console.log(`PluginManager initialized with ${this.plugins.size} plugins`);
  }

  // 发现并加载插件
  private async discoverPlugins(): Promise<void> {
    try {
      // 在不同平台上实现插件发现逻辑
      for (const path of this.pluginPaths) {
        const pluginFiles = await this.getPluginFiles(path);
        
        for (const pluginFile of pluginFiles) {
          try {
            await this.loadPlugin(pluginFile);
          } catch (error) {
            console.error(`Failed to load plugin from ${pluginFile}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error discovering plugins:', error);
    }
  }

  // 获取插件文件列表（平台相关实现）
  private async getPluginFiles(_directory: string): Promise<string[]> {
    // 平台特定的实现将在子类中重写
    // 这里提供一个默认实现
    return [];
  }

  // 加载插件
  private async loadPlugin(pluginPath: string): Promise<void> {
    try {
      // 1. 读取插件的package.json获取元数据
      const metadata = await this.readPluginMetadata(pluginPath);
      if (!metadata) {
        console.warn(`Invalid plugin metadata for ${pluginPath}`);
        return;
      }

      // 2. 加载插件的主入口
      const pluginExports = await this.loadPluginExports(pluginPath, metadata.main || 'index.js');
      
      // 3. 创建插件上下文
      const context = this.createPluginContext(pluginPath, metadata.id);
      
      // 4. 保存插件信息
      const plugin: LoadedPlugin = {
        id: metadata.id,
        metadata,
        exports: pluginExports,
        context
      };
      
      this.plugins.set(metadata.id, plugin);
      
      // 5. 如果有contributes.commands，注册命令
      if (metadata.contributes?.commands) {
        metadata.contributes.commands.forEach(cmd => {
          if (cmd.command) {
            this.commands.set(cmd.command, () => {
              console.warn(`Command ${cmd.command} registered but no handler provided`);
            });
          }
        });
      }
      
      console.log(`Loaded plugin: ${metadata.name} (${metadata.id})`);
    } catch (error) {
      const pluginId = pluginPath.split('/').pop() || pluginPath;
      this.pluginErrors.push({
        pluginId,
        message: `Failed to load plugin from ${pluginPath}`,
        error: error as Error
      });
      console.error(`Error loading plugin ${pluginId}:`, error);
    }
  }

  // 读取插件元数据
  private async readPluginMetadata(pluginPath: string): Promise<PluginMetadata | null> {
    try {
      // 平台特定的实现将在子类中重写
      return null;
    } catch (error) {
      console.error(`Error reading plugin metadata from ${pluginPath}:`, error);
      return null;
    }
  }

  // 加载插件导出
  private async loadPluginExports(pluginPath: string, mainFile: string): Promise<PluginExports> {
    try {
      // 平台特定的实现将在子类中重写
      // 这里提供一个默认实现
      throw new Error('Plugin loading not implemented for this platform');
    } catch (error) {
      console.error(`Error loading plugin exports from ${pluginPath}/${mainFile}:`, error);
      throw error;
    }
  }

  // 创建插件上下文
  private createPluginContext(pluginPath: string, pluginId: string): PluginContext {
    return {
      pluginId,
      extensionPath: pluginPath,
      subscriptions: [],
      commands: {
        registerCommand: (id, callback) => {
          this.commands.set(id, callback);
          return { dispose: () => this.commands.delete(id) };
        },
        executeCommand: (id, ...args) => {
          return this.executeCommand(id, ...args);
        }
      },
      storage: {
        get: async (key: string) => {
          return platform.storage.get(`plugin_${pluginId}_${key}`);
        },
        set: async (key: string, value: any) => {
          return platform.storage.set(`plugin_${pluginId}_${key}`, value);
        },
        remove: async (key: string) => {
          return platform.storage.remove(`plugin_${pluginId}_${key}`);
        }
      },
      messaging: {
        sendMessage: async (message: any) => {
          return platform.messaging.sendMessage({
            ...message,
            pluginId
          });
        },
        onMessage: (callback: (message: any) => void) => {
          const wrappedCallback = (message: any) => {
            if (message.pluginId === pluginId || !message.pluginId) {
              callback(message);
            }
          };
          platform.messaging.onMessage(wrappedCallback);
          return {
            dispose: () => platform.messaging.offMessage(wrappedCallback)
          };
        }
      }
    };
  }

  // 激活所有插件
  async activateAll(): Promise<void> {
    for (const [, plugin] of this.plugins) {
      await this.activatePlugin(plugin.id);
    }
  }

  // 激活特定插件
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      await plugin.exports.activate(plugin.context);
      console.log(`Activated plugin: ${plugin.metadata.name} (${pluginId})`);
    } catch (error) {
      this.pluginErrors.push({
        pluginId,
        message: `Failed to activate plugin ${pluginId}`,
        error: error as Error
      });
      console.error(`Error activating plugin ${pluginId}:`, error);
    }
  }

  // 停用所有插件
  async deactivateAll(): Promise<void> {
    for (const [, plugin] of this.plugins) {
      await this.deactivatePlugin(plugin.id);
    }
  }

  // 停用特定插件
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // 执行插件的停用函数
      if (plugin.exports.deactivate) {
        await plugin.exports.deactivate();
      }
      
      // 清理订阅
      for (const subscription of plugin.context.subscriptions) {
        subscription.dispose();
      }
      
      console.log(`Deactivated plugin: ${plugin.metadata.name} (${pluginId})`);
    } catch (error) {
      console.error(`Error deactivating plugin ${pluginId}:`, error);
    }
  }

  // 执行命令
  async executeCommand(commandId: string, ...args: any[]): Promise<any> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command ${commandId} not found`);
    }

    try {
      return await command(...args);
    } catch (error) {
      console.error(`Error executing command ${commandId}:`, error);
      throw error;
    }
  }

  // 获取已加载的插件列表
  getPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  // 获取插件错误信息
  getPluginErrors(): PluginError[] {
    return this.pluginErrors;
  }

  // 卸载插件
  async unloadPlugin(pluginId: string): Promise<void> {
    await this.deactivatePlugin(pluginId);
    this.plugins.delete(pluginId);
    
    // 清理该插件注册的命令
    for (const [commandId] of this.commands.entries()) {
      if (commandId.startsWith(`${pluginId}.`)) {
        this.commands.delete(commandId);
      }
    }
    
    console.log(`Unloaded plugin: ${pluginId}`);
  }
}

// 导出单例实例
export const pluginManager = new PluginManager();

// 导出类用于扩展
export { PluginManager };