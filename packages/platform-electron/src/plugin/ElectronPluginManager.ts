import { PluginManager } from '@core/index';
import { PluginMetadata, PluginExports } from '@core/index';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Electron平台特定的插件管理器
class ElectronPluginManager extends PluginManager {
  // 默认插件目录路径
  private defaultPluginPath: string;
  // 自定义插件目录路径
  private customPluginPath: string | null = null;

  constructor() {
    super();
    // 设置默认插件目录（应用数据目录下的plugins文件夹）
    this.defaultPluginPath = path.join(app.getPath('userData'), 'plugins');
    
    // 确保默认插件目录存在
    this.ensurePluginDirectoryExists();
  }

  // 确保插件目录存在
  private ensurePluginDirectoryExists(): void {
    try {
      const pluginDir = this.getPluginDirectory();
      if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
        console.log(`Created plugin directory: ${pluginDir}`);
      }
    } catch (error) {
      console.error('Failed to create plugin directory:', error);
    }
  }

  // 获取插件目录路径
  private getPluginDirectory(): string {
    return this.customPluginPath || this.defaultPluginPath;
  }

  // 设置自定义插件目录
  setCustomPluginPath(customPath: string): void {
    this.customPluginPath = customPath;
    this.ensurePluginDirectoryExists();
  }

  // 获取插件文件列表（Electron实现）
  protected async getPluginFiles(directory: string): Promise<string[]> {
    try {
      // 使用Node.js的fs模块读取目录
      const pluginDir = this.getPluginDirectory();
      
      // 检查插件目录是否存在
      if (!fs.existsSync(pluginDir)) {
        console.warn(`Plugin directory not found: ${pluginDir}`);
        return [];
      }
      
      // 读取目录内容
      const files = fs.readdirSync(pluginDir);
      
      // 过滤出包含plugin.json的子目录（作为插件标识）
      const pluginPaths: string[] = [];
      
      for (const file of files) {
        const pluginPath = path.join(pluginDir, file);
        const stat = fs.statSync(pluginPath);
        
        // 检查是否为目录且包含plugin.json
        if (stat.isDirectory()) {
          const pluginJsonPath = path.join(pluginPath, 'plugin.json');
          if (fs.existsSync(pluginJsonPath)) {
            pluginPaths.push(path.join(directory, file));
          }
        }
      }
      
      return pluginPaths;
    } catch (error) {
      console.error('Error getting plugin files in Electron:', error);
      return [];
    }
  }

  // 读取插件元数据（Electron实现）
  protected async readPluginMetadata(pluginPath: string): Promise<PluginMetadata | null> {
    try {
      const pluginId = pluginPath.split(path.sep).pop() || 'unknown';
      const pluginDir = this.getPluginDirectory();
      const metadataPath = path.join(pluginDir, pluginId, 'plugin.json');
      
      // 检查元数据文件是否存在
      if (!fs.existsSync(metadataPath)) {
        console.warn(`Plugin metadata not found: ${metadataPath}`);
        return null;
      }
      
      // 读取并解析元数据文件
      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      // 验证元数据格式
      if (metadata && metadata.name && metadata.version && metadata.main) {
        return metadata;
      }
      
      console.warn(`Invalid plugin metadata format: ${metadataPath}`);
      return null;
    } catch (error) {
      console.error(`Error reading plugin metadata from ${pluginPath}:`, error);
      return null;
    }
  }

  // 加载插件导出（Electron实现）
  protected async loadPluginExports(pluginPath: string, mainFile: string): Promise<PluginExports> {
    try {
      const pluginId = pluginPath.split(path.sep).pop() || 'unknown';
      const pluginDir = this.getPluginDirectory();
      const pluginFilePath = path.join(pluginDir, pluginId, mainFile);
      
      // 检查插件主文件是否存在
      if (!fs.existsSync(pluginFilePath)) {
        throw new Error(`Plugin main file not found: ${pluginFilePath}`);
      }
      
      // 清除模块缓存，确保每次都是最新版本
      delete require.cache[require.resolve(pluginFilePath)];
      
      // 使用Node.js的require加载插件模块
      const pluginModule = require(pluginFilePath);
      
      // 确保返回的对象符合PluginExports接口
      const exports: PluginExports = {
        activate: pluginModule.activate,
        deactivate: pluginModule.deactivate
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

  // 安装插件（Electron特有方法）
  async installPlugin(pluginData: {
    id: string;
    metadata: PluginMetadata;
    files: Record<string, string>; // 文件路径和内容的映射
  }): Promise<boolean> {
    try {
      // 1. 验证插件数据
      if (!pluginData.id || !pluginData.metadata || !pluginData.files) {
        throw new Error('Invalid plugin data');
      }
      
      const pluginDir = this.getPluginDirectory();
      const pluginInstallPath = path.join(pluginDir, pluginData.id);
      
      // 2. 如果插件已存在，先删除旧版本
      if (fs.existsSync(pluginInstallPath)) {
        try {
          // 先停用插件
          await this.deactivatePlugin(pluginData.id);
          // 卸载插件
          await this.unloadPlugin(pluginData.id);
          // 删除插件目录
          this.removeDirectory(pluginInstallPath);
        } catch (error) {
          console.warn(`Error removing existing plugin ${pluginData.id}:`, error);
        }
      }
      
      // 3. 创建插件目录
      fs.mkdirSync(pluginInstallPath, { recursive: true });
      
      // 4. 写入插件文件
      for (const [filePath, content] of Object.entries(pluginData.files)) {
        const absoluteFilePath = path.join(pluginInstallPath, filePath);
        const directory = path.dirname(absoluteFilePath);
        
        // 确保目录存在
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        // 写入文件
        fs.writeFileSync(absoluteFilePath, content);
      }
      
      // 5. 如果没有提供plugin.json，创建一个
      const pluginJsonPath = path.join(pluginInstallPath, 'plugin.json');
      if (!fs.existsSync(pluginJsonPath)) {
        fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginData.metadata, null, 2));
      }
      
      // 6. 加载并激活插件
      await this.discoverAndLoadPlugins();
      await this.activatePlugin(pluginData.id);
      
      console.log(`Plugin installed successfully: ${pluginData.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to install plugin ${pluginData.id}:`, error);
      return false;
    }
  }

  // 卸载插件（Electron特有方法）
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      const pluginDir = this.getPluginDirectory();
      const pluginPath = path.join(pluginDir, pluginId);
      
      // 1. 先停用插件
      try {
        await this.deactivatePlugin(pluginId);
      } catch (error) {
        console.warn(`Error deactivating plugin before uninstall: ${pluginId}`, error);
      }
      
      // 2. 卸载插件
      await this.unloadPlugin(pluginId);
      
      // 3. 删除插件目录
      if (fs.existsSync(pluginPath)) {
        this.removeDirectory(pluginPath);
      }
      
      console.log(`Plugin uninstalled successfully: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      return false;
    }
  }

  // 递归删除目录
  private removeDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const curPath = path.join(dirPath, file);
        if (fs.statSync(curPath).isDirectory()) {
          this.removeDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      }
      fs.rmdirSync(dirPath);
    }
  }

  // 列出已安装的插件
  async listInstalledPlugins(): Promise<Array<{ id: string; metadata: PluginMetadata; path: string }>> {
    try {
      const pluginDir = this.getPluginDirectory();
      
      if (!fs.existsSync(pluginDir)) {
        return [];
      }
      
      const plugins: Array<{ id: string; metadata: PluginMetadata; path: string }> = [];
      const directories = fs.readdirSync(pluginDir).filter(file => {
        const filePath = path.join(pluginDir, file);
        return fs.statSync(filePath).isDirectory();
      });
      
      for (const dir of directories) {
        const pluginJsonPath = path.join(pluginDir, dir, 'plugin.json');
        if (fs.existsSync(pluginJsonPath)) {
          try {
            const metadataContent = fs.readFileSync(pluginJsonPath, 'utf8');
            const metadata = JSON.parse(metadataContent);
            
            if (metadata && metadata.name && metadata.version) {
              plugins.push({
                id: dir,
                metadata,
                path: path.join(pluginDir, dir)
              });
            }
          } catch (error) {
            console.warn(`Error reading metadata for plugin ${dir}:`, error);
          }
        }
      }
      
      return plugins;
    } catch (error) {
      console.error('Error listing installed plugins:', error);
      return [];
    }
  }

  // 重新加载插件
  async reloadPlugin(pluginId: string): Promise<boolean> {
    try {
      // 1. 停用并卸载插件
      await this.deactivatePlugin(pluginId);
      await this.unloadPlugin(pluginId);
      
      // 2. 清除Node.js模块缓存
      const pluginDir = this.getPluginDirectory();
      const pluginPath = path.join(pluginDir, pluginId);
      
      // 递归清除所有相关模块缓存
      this.clearModuleCache(pluginPath);
      
      // 3. 重新加载插件
      const metadata = await this.readPluginMetadata(`plugins/${pluginId}`);
      if (!metadata || !metadata.main) {
        throw new Error(`Invalid metadata for plugin ${pluginId}`);
      }
      
      const exports = await this.loadPluginExports(`plugins/${pluginId}`, metadata.main);
      await this.registerPlugin(pluginId, metadata, exports);
      await this.activatePlugin(pluginId);
      
      console.log(`Plugin reloaded successfully: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Failed to reload plugin ${pluginId}:`, error);
      return false;
    }
  }

  // 清除模块缓存
  private clearModuleCache(modulePath: string): void {
    const normalizedPath = path.normalize(modulePath);
    
    // 遍历缓存并清除匹配的模块
    for (const key in require.cache) {
      if (key.startsWith(normalizedPath)) {
        delete require.cache[key];
      }
    }
  }

  // 获取插件路径
  getPluginPath(pluginId: string): string {
    return path.join(this.getPluginDirectory(), pluginId);
  }
}

// 导出Electron特定的插件管理器实例
export const electronPluginManager = new ElectronPluginManager();

// 导出类
export { ElectronPluginManager };