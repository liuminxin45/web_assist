import { PluginManager } from '@core/index';
import { PluginMetadata, PluginExports } from '@core/index';

// Web平台特定的插件管理器
class WebPluginManager extends PluginManager {
  // 插件加载的基础URL路径
  private basePluginUrl: string = '/plugins';

  constructor(basePluginUrl?: string) {
    super();
    if (basePluginUrl) {
      this.basePluginUrl = basePluginUrl;
    }
  }

  // 获取插件文件列表（Web实现）
  protected async getPluginFiles(directory: string): Promise<string[]> {
    try {
      // 在Web环境中，我们通过HTTP请求获取插件目录列表
      // 这需要后端API支持，或者前端配置的插件列表
      
      // 1. 尝试从localStorage获取已配置的插件列表
      const configuredPlugins = this.getConfiguredPlugins();
      if (configuredPlugins.length > 0) {
        return configuredPlugins.map(plugin => `${directory}/${plugin.id}`);
      }
      
      // 2. 尝试从API获取插件列表
      try {
        const response = await fetch(`${this.basePluginUrl}/list`);
        if (response.ok) {
          const plugins = await response.json();
          return plugins.map((plugin: { id: string }) => `${directory}/${plugin.id}`);
        }
      } catch (apiError) {
        console.warn('Failed to fetch plugins from API:', apiError);
      }
      
      // 3. 如果以上方法都失败，返回空数组
      return [];
    } catch (error) {
      console.error('Error getting plugin files in Web platform:', error);
      return [];
    }
  }

  // 从localStorage获取配置的插件列表
  private getConfiguredPlugins(): Array<{ id: string }> {
    try {
      const pluginsJson = localStorage.getItem('configuredPlugins');
      if (pluginsJson) {
        return JSON.parse(pluginsJson);
      }
      return [];
    } catch (error) {
      console.error('Error reading configured plugins from localStorage:', error);
      return [];
    }
  }

  // 读取插件元数据（Web实现）
  protected async readPluginMetadata(pluginPath: string): Promise<PluginMetadata | null> {
    try {
      // 1. 尝试从localStorage获取元数据
      const pluginId = pluginPath.split('/').pop() || 'unknown';
      const storedMetadata = this.getStoredMetadata(pluginId);
      if (storedMetadata) {
        return storedMetadata;
      }
      
      // 2. 尝试通过HTTP请求获取元数据
      const metadataUrl = `${this.basePluginUrl}/${pluginId}/plugin.json`;
      const response = await fetch(metadataUrl);
      
      if (response.ok) {
        const metadata = await response.json();
        // 验证元数据格式
        if (metadata && metadata.name && metadata.version && metadata.main) {
          // 存储到localStorage以便下次快速访问
          this.storeMetadata(pluginId, metadata);
          return metadata;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error reading plugin metadata from ${pluginPath}:`, error);
      return null;
    }
  }

  // 从localStorage获取存储的元数据
  private getStoredMetadata(pluginId: string): PluginMetadata | null {
    try {
      const metadataJson = localStorage.getItem(`plugin_metadata_${pluginId}`);
      if (metadataJson) {
        return JSON.parse(metadataJson);
      }
      return null;
    } catch (error) {
      console.error(`Error reading stored metadata for plugin ${pluginId}:`, error);
      return null;
    }
  }

  // 存储元数据到localStorage
  private storeMetadata(pluginId: string, metadata: PluginMetadata): void {
    try {
      localStorage.setItem(`plugin_metadata_${pluginId}`, JSON.stringify(metadata));
    } catch (error) {
      console.error(`Error storing metadata for plugin ${pluginId}:`, error);
    }
  }

  // 加载插件导出（Web实现）
  protected async loadPluginExports(pluginPath: string, mainFile: string): Promise<PluginExports> {
    try {
      const pluginId = pluginPath.split('/').pop() || 'unknown';
      const pluginUrl = `${this.basePluginUrl}/${pluginId}/${mainFile}`;
      
      // 使用动态import加载插件模块
      // 注意：这需要服务器配置正确的CORS策略和MIME类型
      const module = await import(/* webpackIgnore: true */ pluginUrl);
      
      // 确保返回的对象符合PluginExports接口
      const exports: PluginExports = {
        activate: module.activate,
        deactivate: module.deactivate
      };
      
      if (typeof exports.activate !== 'function') {
        throw new Error(`Plugin ${pluginId} must export an activate function`);
      }
      
      return exports;
    } catch (error) {
      console.error(`Error loading plugin exports from ${pluginPath}/${mainFile}:`, error);
      throw error;
    }
  }

  // 安装插件（Web特有方法）
  async installPlugin(pluginData: { 
    id: string; 
    metadata: PluginMetadata; 
    code: string; 
    mainFile?: string 
  }): Promise<boolean> {
    try {
      // 1. 验证插件数据
      if (!pluginData.id || !pluginData.metadata || !pluginData.code) {
        throw new Error('Invalid plugin data');
      }
      
      // 2. 在Web环境中，我们可以：
      //    a. 将插件数据存储到localStorage
      //    b. 或者将插件数据发送到服务器进行持久化
      
      // 存储插件元数据
      this.storeMetadata(pluginData.id, pluginData.metadata);
      
      // 存储插件代码
      localStorage.setItem(`plugin_code_${pluginData.id}`, pluginData.code);
      
      // 3. 更新配置的插件列表
      const configuredPlugins = this.getConfiguredPlugins();
      const existingIndex = configuredPlugins.findIndex(p => p.id === pluginData.id);
      
      if (existingIndex >= 0) {
        // 更新现有插件
        configuredPlugins[existingIndex] = { 
          id: pluginData.id, 
          updatedAt: Date.now() 
        };
      } else {
        // 添加新插件
        configuredPlugins.push({ 
          id: pluginData.id, 
          installedAt: Date.now(), 
          updatedAt: Date.now() 
        });
      }
      
      localStorage.setItem('configuredPlugins', JSON.stringify(configuredPlugins));
      
      // 4. 加载并激活插件
      await this.loadPlugin(pluginData.id);
      
      console.log(`Plugin installed successfully: ${pluginData.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to install plugin ${pluginData.id}:`, error);
      return false;
    }
  }

  // 卸载插件（Web特有方法）
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      // 1. 先停用插件
      try {
        await this.deactivatePlugin(pluginId);
      } catch (error) {
        console.warn(`Error deactivating plugin before uninstall: ${pluginId}`, error);
      }
      
      // 2. 从localStorage中删除插件数据
      localStorage.removeItem(`plugin_metadata_${pluginId}`);
      localStorage.removeItem(`plugin_code_${pluginId}`);
      
      // 3. 从配置列表中移除
      const configuredPlugins = this.getConfiguredPlugins();
      const updatedPlugins = configuredPlugins.filter(p => p.id !== pluginId);
      localStorage.setItem('configuredPlugins', JSON.stringify(updatedPlugins));
      
      // 4. 从插件管理器中卸载
      await this.unloadPlugin(pluginId);
      
      console.log(`Plugin uninstalled successfully: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      return false;
    }
  }

  // 加载已安装的插件（从localStorage）
  async loadInstalledPlugins(): Promise<void> {
    const configuredPlugins = this.getConfiguredPlugins();
    
    for (const pluginInfo of configuredPlugins) {
      try {
        await this.loadPlugin(pluginInfo.id);
      } catch (error) {
        console.error(`Failed to load installed plugin ${pluginInfo.id}:`, error);
      }
    }
  }

  // 加载单个插件（从localStorage）
  private async loadPlugin(pluginId: string): Promise<void> {
    try {
      // 获取插件元数据
      const metadata = this.getStoredMetadata(pluginId);
      if (!metadata || !metadata.main) {
        throw new Error(`Invalid metadata for plugin ${pluginId}`);
      }
      
      // 获取插件代码
      const pluginCode = localStorage.getItem(`plugin_code_${pluginId}`);
      if (!pluginCode) {
        throw new Error(`No code found for plugin ${pluginId}`);
      }
      
      // 使用Function构造函数创建插件模块
      // 注意：这种方法存在安全风险，实际应用中需要更严格的验证
      const moduleFactory = new Function(
        'module',
        'exports',
        pluginCode
      );
      
      const pluginModule: any = {
        exports: {}
      };
      
      moduleFactory(pluginModule, pluginModule.exports);
      
      // 提取插件导出
      const pluginExports: PluginExports = {
        activate: pluginModule.exports.activate,
        deactivate: pluginModule.exports.deactivate
      };
      
      if (typeof pluginExports.activate !== 'function') {
        throw new Error(`Plugin ${pluginId} must export an activate function`);
      }
      
      // 注册插件
      await this.registerPlugin(pluginId, metadata, pluginExports);
      
    } catch (error) {
      console.error(`Error loading plugin ${pluginId}:`, error);
      throw error;
    }
  }

  // 设置基础插件URL路径
  setBasePluginUrl(url: string): void {
    this.basePluginUrl = url;
  }

  // 获取基础插件URL路径
  getBasePluginUrl(): string {
    return this.basePluginUrl;
  }
}

// 导出Web特定的插件管理器实例
export const webPluginManager = new WebPluginManager();

// 导出类
export { WebPluginManager };