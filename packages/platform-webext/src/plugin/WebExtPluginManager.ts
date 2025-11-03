import { PluginManager } from '@core/index';
import { PluginMetadata, PluginExports } from '@core/index';

// WebExtension平台特定的插件管理器
class WebExtPluginManager extends PluginManager {
  // 获取插件文件列表（WebExtension实现）
  protected async getPluginFiles(directory: string): Promise<string[]> {
    try {
      // 在WebExtension环境中，我们需要特殊处理插件加载
      // 1. 从storage中读取已安装的插件配置
      const installedPlugins = await this.getInstalledPlugins();
      
      // 2. 验证每个插件的有效性
      const validPluginPaths: string[] = [];
      for (const pluginInfo of installedPlugins) {
        try {
          // 简单检查插件ID格式
          if (pluginInfo.id && typeof pluginInfo.id === 'string') {
            validPluginPaths.push(`plugins/${pluginInfo.id}`);
          }
        } catch (error) {
          console.warn(`Invalid plugin entry: ${JSON.stringify(pluginInfo)}`, error);
        }
      }
      
      return validPluginPaths;
    } catch (error) {
      console.error('Error getting plugin files in WebExtension:', error);
      return [];
    }
  }

  // 从storage获取已安装的插件
  private async getInstalledPlugins(): Promise<any[]> {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get('installedPlugins', (result) => {
            resolve(result.installedPlugins || []);
          });
        } else {
          resolve([]);
        }
      } catch (error) {
        console.error('Error reading installed plugins:', error);
        resolve([]);
      }
    });
  }

  // 读取插件元数据（WebExtension实现）
  protected async readPluginMetadata(pluginPath: string): Promise<PluginMetadata | null> {
    try {
      // 在WebExtension中，我们需要从扩展资源中加载插件元数据
      // 这里简化处理，实际实现可能需要：
      // 1. 通过chrome.runtime.getURL获取插件资源URL
      // 2. 发送消息到background script加载资源
      // 3. 或者使用fetch获取资源内容
      
      // 模拟实现 - 实际使用时需要替换为真实的元数据加载逻辑
      const pluginId = pluginPath.split('/').pop() || 'unknown';
      
      // 从storage中获取插件元数据
      return await this.getPluginMetadataFromStorage(pluginId);
    } catch (error) {
      console.error(`Error reading plugin metadata from ${pluginPath}:`, error);
      return null;
    }
  }

  // 从storage获取插件元数据
  private async getPluginMetadataFromStorage(pluginId: string): Promise<PluginMetadata | null> {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(`plugin_metadata_${pluginId}`, (result) => {
            resolve(result[`plugin_metadata_${pluginId}`] || null);
          });
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error(`Error reading metadata for plugin ${pluginId}:`, error);
        resolve(null);
      }
    });
  }

  // 加载插件导出（WebExtension实现）
  protected async loadPluginExports(pluginPath: string, mainFile: string): Promise<PluginExports> {
    try {
      // 在WebExtension中，动态加载插件代码有安全限制
      // 我们需要使用消息传递机制与background script通信
      // 或者使用chrome.runtime.getURL + import()
      
      // 简化实现 - 通过消息传递到background script加载插件
      return await this.loadPluginExportsViaMessage(pluginPath, mainFile);
    } catch (error) {
      console.error(`Error loading plugin exports from ${pluginPath}/${mainFile}:`, error);
      throw error;
    }
  }

  // 通过消息传递加载插件导出
  private async loadPluginExportsViaMessage(pluginPath: string, mainFile: string): Promise<PluginExports> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              type: 'LOAD_PLUGIN',
              payload: {
                pluginPath,
                mainFile
              }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
              }
              
              if (response && response.error) {
                reject(new Error(response.error));
                return;
              }
              
              if (response && response.exports && typeof response.exports.activate === 'function') {
                // 包装远程函数调用
                const wrappedExports: PluginExports = {
                  activate: async (context) => {
                    // 这里需要通过消息传递来执行远程激活函数
                    // 简化处理，实际实现需要更复杂的序列化/反序列化逻辑
                    await this.executeRemotePluginFunction(pluginPath, 'activate', [context]);
                  },
                  deactivate: response.exports.deactivate ? async () => {
                    await this.executeRemotePluginFunction(pluginPath, 'deactivate', []);
                  } : undefined
                };
                resolve(wrappedExports);
              } else {
                reject(new Error('Invalid plugin exports'));
              }
            }
          );
        } else {
          reject(new Error('Chrome runtime not available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // 执行远程插件函数
  private async executeRemotePluginFunction(pluginPath: string, functionName: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              type: 'EXECUTE_PLUGIN_FUNCTION',
              payload: {
                pluginPath,
                functionName,
                args
              }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
              }
              
              if (response && response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response?.result);
              }
            }
          );
        } else {
          reject(new Error('Chrome runtime not available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // 安装插件（WebExtension特有方法）
  async installPlugin(pluginData: { id: string; metadata: PluginMetadata; code: string }): Promise<boolean> {
    try {
      // 1. 验证插件数据
      if (!pluginData.id || !pluginData.metadata || !pluginData.code) {
        throw new Error('Invalid plugin data');
      }
      
      // 2. 保存插件元数据到storage
      await this.savePluginMetadata(pluginData.id, pluginData.metadata);
      
      // 3. 保存插件代码到storage
      await this.savePluginCode(pluginData.id, pluginData.code);
      
      // 4. 更新已安装插件列表
      await this.updateInstalledPluginsList(pluginData.id);
      
      console.log(`Plugin installed successfully: ${pluginData.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to install plugin ${pluginData.id}:`, error);
      return false;
    }
  }

  // 保存插件元数据
  private async savePluginMetadata(pluginId: string, metadata: PluginMetadata): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(
          { [`plugin_metadata_${pluginId}`]: metadata },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      } else {
        reject(new Error('Chrome storage not available'));
      }
    });
  }

  // 保存插件代码
  private async savePluginCode(pluginId: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(
          { [`plugin_code_${pluginId}`]: code },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      } else {
        reject(new Error('Chrome storage not available'));
      }
    });
  }

  // 更新已安装插件列表
  private async updateInstalledPluginsList(pluginId: string): Promise<void> {
    const installedPlugins = await this.getInstalledPlugins();
    
    // 检查插件是否已存在
    const existingIndex = installedPlugins.findIndex(p => p.id === pluginId);
    if (existingIndex >= 0) {
      // 更新现有插件
      installedPlugins[existingIndex] = { id: pluginId, updatedAt: Date.now() };
    } else {
      // 添加新插件
      installedPlugins.push({ id: pluginId, installedAt: Date.now(), updatedAt: Date.now() });
    }
    
    // 保存更新后的列表
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ installedPlugins }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Chrome storage not available'));
      }
    });
  }

  // 卸载插件（WebExtension特有方法）
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      // 1. 先停用插件
      try {
        await this.deactivatePlugin(pluginId);
      } catch (error) {
        console.warn(`Error deactivating plugin before uninstall: ${pluginId}`, error);
      }
      
      // 2. 从storage中删除插件数据
      await this.removePluginData(pluginId);
      
      // 3. 从已安装列表中移除
      await this.removePluginFromInstalledList(pluginId);
      
      // 4. 从插件管理器中卸载
      await this.unloadPlugin(pluginId);
      
      console.log(`Plugin uninstalled successfully: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      return false;
    }
  }

  // 删除插件数据
  private async removePluginData(pluginId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(
          [`plugin_metadata_${pluginId}`, `plugin_code_${pluginId}`],
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      } else {
        reject(new Error('Chrome storage not available'));
      }
    });
  }

  // 从已安装列表中移除插件
  private async removePluginFromInstalledList(pluginId: string): Promise<void> {
    const installedPlugins = await this.getInstalledPlugins();
    const updatedPlugins = installedPlugins.filter(p => p.id !== pluginId);
    
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ installedPlugins: updatedPlugins }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Chrome storage not available'));
      }
    });
  }
}

// 导出WebExtension特定的插件管理器实例
export const webExtPluginManager = new WebExtPluginManager();

// 导出类
export { WebExtPluginManager };