// 示例插件主入口文件

/**
 * 激活插件
 * @param {import('@core/index').PluginContext} context - 插件上下文
 */
export function activate(context) {
  console.log('示例计数器插件已激活');
  
  // 获取核心服务
  const coreService = context.services.core;
  
  // 注册命令处理器
  context.subscriptions.push(
    context.commands.registerCommand('examplePlugin.increment', async () => {
      console.log('执行增加计数器命令');
      try {
        // 调用核心服务增加计数
        const newValue = await coreService.increment();
        console.log('计数器值:', newValue);
        
        // 显示通知
        context.notifications.info(`计数器已增加到: ${newValue}`);
        
        // 发送消息通知其他部分
        context.messaging.send('counter:changed', { value: newValue });
        
        return newValue;
      } catch (error) {
        console.error('增加计数失败:', error);
        context.notifications.error('增加计数失败: ' + error.message);
        throw error;
      }
    })
  );
  
  context.subscriptions.push(
    context.commands.registerCommand('examplePlugin.decrement', async () => {
      console.log('执行减少计数器命令');
      try {
        // 调用核心服务减少计数
        const newValue = await coreService.decrement();
        console.log('计数器值:', newValue);
        
        // 显示通知
        context.notifications.info(`计数器已减少到: ${newValue}`);
        
        // 发送消息通知其他部分
        context.messaging.send('counter:changed', { value: newValue });
        
        return newValue;
      } catch (error) {
        console.error('减少计数失败:', error);
        context.notifications.error('减少计数失败: ' + error.message);
        throw error;
      }
    })
  );
  
  // 监听消息
  context.subscriptions.push(
    context.messaging.on('counter:externalChange', (event) => {
      console.log('收到外部计数器变更通知:', event);
      context.notifications.info(`计数器已被外部更新为: ${event.value}`);
    })
  );
  
  // 添加视图贡献
  context.subscriptions.push(
    context.views.registerView('counterView', {
      title: '计数器视图',
      render: async () => {
        // 获取当前计数
        const currentCount = await coreService.getCount();
        
        // 返回视图内容
        return {
          html: `
            <div class="counter-view">
              <h2>计数器插件视图</h2>
              <p>当前计数: <strong>${currentCount}</strong></p>
              <button id="increment-btn">增加</button>
              <button id="decrement-btn">减少</button>
            </div>
          `,
          onMount: (element) => {
            // 绑定事件处理
            element.querySelector('#increment-btn').addEventListener('click', () => {
              context.commands.executeCommand('examplePlugin.increment');
            });
            
            element.querySelector('#decrement-btn').addEventListener('click', () => {
              context.commands.executeCommand('examplePlugin.decrement');
            });
          },
          css: `
            .counter-view {
              padding: 16px;
              border-radius: 8px;
              background-color: #f5f5f5;
            }
            .counter-view h2 {
              margin-top: 0;
              color: #333;
            }
            .counter-view button {
              padding: 8px 16px;
              margin-right: 8px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              background-color: #0078d4;
              color: white;
            }
            .counter-view button:hover {
              background-color: #005a9e;
            }
          `
        };
      }
    })
  );
  
  // 注册一个自定义服务
  const counterService = {
    getDoubleCount: async () => {
      const count = await coreService.getCount();
      return count * 2;
    },
    resetCount: async () => {
      await coreService.setCount(0);
      context.notifications.info('计数器已重置');
      return 0;
    }
  };
  
  context.subscriptions.push(
    context.services.register('example.counter', counterService)
  );
  
  // 注册一个配置项
  context.subscriptions.push(
    context.configuration.registerConfiguration({
      id: 'examplePlugin',
      title: '示例插件',
      type: 'object',
      properties: {
        showNotifications: {
          type: 'boolean',
          default: true,
          description: '是否显示通知'
        },
        stepSize: {
          type: 'number',
          default: 1,
          description: '计数增减的步长'
        }
      }
    })
  );
  
  // 返回插件API，可供其他插件使用
  return {
    // 插件公开的API
    getPluginInfo: () => {
      return {
        name: '示例计数器插件',
        version: '1.0.0',
        description: '一个简单的示例插件，用于演示插件系统'
      };
    },
    
    // 提供一些辅助方法
    createCounterWidget: (options = {}) => {
      const container = document.createElement('div');
      container.className = 'counter-widget';
      container.innerHTML = `
        <div style="
          padding: 12px;
          background-color: ${options.backgroundColor || '#e6f7ff'};
          border-radius: 6px;
          text-align: center;
          font-family: sans-serif;
        ">
          <div style="font-size: 14px; color: #666;">${options.label || '计数器'}</div>
          <div id="counter-value" style="font-size: 24px; font-weight: bold; margin: 8px 0;">
            0
          </div>
        </div>
      `;
      
      // 监听计数器变化
      const unsubscribe = context.messaging.on('counter:changed', (event) => {
        const valueElement = container.querySelector('#counter-value');
        if (valueElement) {
          valueElement.textContent = event.value;
        }
      });
      
      // 获取初始值
      coreService.getCount().then(count => {
        const valueElement = container.querySelector('#counter-value');
        if (valueElement) {
          valueElement.textContent = count;
        }
      });
      
      // 提供销毁方法
      container.destroy = () => {
        unsubscribe();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };
      
      return container;
    }
  };
}

/**
 * 停用插件
 * @param {import('@core/index').PluginContext} context - 插件上下文
 */
export function deactivate(context) {
  console.log('示例计数器插件已停用');
  
  // 这里可以执行清理操作
  // 注意：subscriptions会自动清理，无需手动处理
  
  // 发送停用通知
  context.notifications.info('示例计数器插件已停用');
}

// 导出插件元数据（用于快速访问）
export const metadata = {
  name: '示例计数器插件',
  version: '1.0.0'
};