import { platform } from '../../../platform/index';

// 跨进程消息类型
enum IpcMessageType {
  REQUEST = 'IPC_REQUEST',
  RESPONSE = 'IPC_RESPONSE',
  NOTIFICATION = 'IPC_NOTIFICATION',
  ERROR = 'IPC_ERROR',
  HANDSHAKE = 'IPC_HANDSHAKE',
}

// 基础消息接口
interface IpcBaseMessage {
  type: IpcMessageType;
  timestamp: number;
  sender: string;          // 发送者标识
  target?: string;         // 目标标识（可选）
  payload?: any;           // 消息内容
}

// 请求消息接口
interface IpcRequestMessage extends IpcBaseMessage {
  type: IpcMessageType.REQUEST;
  requestId: string;       // 请求ID
  method: string;          // 请求方法
  params?: any[];          // 请求参数
}

// 响应消息接口
interface IpcResponseMessage extends IpcBaseMessage {
  type: IpcMessageType.RESPONSE;
  requestId: string;       // 对应的请求ID
  result?: any;            // 响应结果
  error?: {                // 错误信息
    code: string;
    message: string;
    details?: any;
  };
}

// 通知消息接口
interface IpcNotificationMessage extends IpcBaseMessage {
  type: IpcMessageType.NOTIFICATION;
  topic: string;           // 通知主题
  data?: any;              // 通知数据
}

// 错误消息接口
interface IpcErrorMessage extends IpcBaseMessage {
  type: IpcMessageType.ERROR;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 握手消息接口
interface IpcHandshakeMessage extends IpcBaseMessage {
  type: IpcMessageType.HANDSHAKE;
  processId: string;       // 进程ID
  processType: string;     // 进程类型
  version: string;         // 版本信息
}

// IPC处理器
interface IpcHandler {
  handle(request: IpcRequestMessage): Promise<any>;
}

// IPC管理器
class IpcManager {
  private handlers = new Map<string, IpcHandler>();
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  private notificationListeners = new Map<string, Set<(data: any) => void>>();
  private processId: string;
  private processType: string;
  private isInitialized = false;
  private connectedProcesses = new Map<string, { processType: string; lastSeen: number }>();

  // 初始化IPC管理器
  initialize(processType: string = 'main'): void {
    if (this.isInitialized) {
      throw new Error('IpcManager already initialized');
    }

    this.processType = processType;
    this.processId = `${processType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 注册消息监听器
    platform.messaging.onMessage(this.handleMessage.bind(this));
    
    // 发送握手消息
    this.sendHandshake();
    
    this.isInitialized = true;
    console.log(`IpcManager initialized (${this.processId}, type: ${this.processType})`);
  }

  // 发送握手消息
  private sendHandshake(): void {
    const handshakeMessage: IpcHandshakeMessage = {
      type: IpcMessageType.HANDSHAKE,
      timestamp: Date.now(),
      sender: this.processId,
      processId: this.processId,
      processType: this.processType,
      version: '1.0.0'
    };
    
    platform.messaging.sendMessage(handshakeMessage).catch(error => {
      console.warn('Failed to send handshake:', error);
    });
  }

  // 处理接收到的消息
  private async handleMessage(message: any): Promise<void> {
    if (!message || !message.type) {
      return;
    }

    // 过滤掉自己发送的消息
    if (message.sender === this.processId) {
      return;
    }

    switch (message.type) {
      case IpcMessageType.REQUEST:
        await this.handleRequest(message as IpcRequestMessage);
        break;
      case IpcMessageType.RESPONSE:
        this.handleResponse(message as IpcResponseMessage);
        break;
      case IpcMessageType.NOTIFICATION:
        this.handleNotification(message as IpcNotificationMessage);
        break;
      case IpcMessageType.ERROR:
        this.handleError(message as IpcErrorMessage);
        break;
      case IpcMessageType.HANDSHAKE:
        this.handleHandshake(message as IpcHandshakeMessage);
        break;
    }
  }

  // 处理请求消息
  private async handleRequest(request: IpcRequestMessage): Promise<void> {
    const handler = this.handlers.get(request.method);
    if (!handler) {
      this.sendErrorResponse(request, {
        code: 'METHOD_NOT_FOUND',
        message: `No handler found for method: ${request.method}`
      });
      return;
    }

    try {
      const result = await handler.handle(request);
      this.sendSuccessResponse(request, result);
    } catch (error) {
      this.sendErrorResponse(request, {
        code: 'HANDLER_ERROR',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      });
    }
  }

  // 发送成功响应
  private sendSuccessResponse(request: IpcRequestMessage, result: any): void {
    const response: IpcResponseMessage = {
      type: IpcMessageType.RESPONSE,
      timestamp: Date.now(),
      sender: this.processId,
      target: request.sender,
      requestId: request.requestId,
      result
    };
    
    platform.messaging.sendMessage(response).catch(error => {
      console.warn('Failed to send success response:', error);
    });
  }

  // 发送错误响应
  private sendErrorResponse(request: IpcRequestMessage, error: { code: string; message: string; details?: any }): void {
    const response: IpcResponseMessage = {
      type: IpcMessageType.RESPONSE,
      timestamp: Date.now(),
      sender: this.processId,
      target: request.sender,
      requestId: request.requestId,
      error
    };
    
    platform.messaging.sendMessage(response).catch(error => {
      console.warn('Failed to send error response:', error);
    });
  }

  // 处理响应消息
  private handleResponse(response: IpcResponseMessage): void {
    const pending = this.pendingRequests.get(response.requestId);
    if (!pending) {
      console.warn(`Received response for unknown request: ${response.requestId}`);
      return;
    }

    this.pendingRequests.delete(response.requestId);
    
    if (response.error) {
      pending.reject(new Error(`${response.error.code}: ${response.error.message}`));
    } else {
      pending.resolve(response.result);
    }
  }

  // 处理通知消息
  private handleNotification(notification: IpcNotificationMessage): void {
    const listeners = this.notificationListeners.get(notification.topic);
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      try {
        listener(notification.data);
      } catch (error) {
        console.error(`Error in notification listener for topic ${notification.topic}:`, error);
      }
    }
  }

  // 处理错误消息
  private handleError(errorMessage: IpcErrorMessage): void {
    console.error(`IPC Error from ${errorMessage.sender}:`, errorMessage.error);
  }

  // 处理握手消息
  private handleHandshake(handshake: IpcHandshakeMessage): void {
    this.connectedProcesses.set(handshake.processId, {
      processType: handshake.processType,
      lastSeen: Date.now()
    });
    
    console.log(`Process connected: ${handshake.processId} (type: ${handshake.processType})`);
    
    // 可以在这里广播新进程连接的通知
    this.notify('process.connected', {
      processId: handshake.processId,
      processType: handshake.processType
    });
  }

  // 发送请求
  sendRequest(method: string, params?: any[], target?: string): Promise<any> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const request: IpcRequestMessage = {
      type: IpcMessageType.REQUEST,
      timestamp: Date.now(),
      sender: this.processId,
      target,
      requestId,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timed out: ${method}`));
      }, 30000); // 30秒超时
      
      platform.messaging.sendMessage(request).catch(error => {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        reject(error);
      });
    });
  }

  // 发送通知
  notify(topic: string, data?: any, target?: string): void {
    const notification: IpcNotificationMessage = {
      type: IpcMessageType.NOTIFICATION,
      timestamp: Date.now(),
      sender: this.processId,
      target,
      topic,
      data
    };
    
    platform.messaging.sendMessage(notification).catch(error => {
      console.warn(`Failed to send notification: ${topic}`, error);
    });
  }

  // 注册方法处理器
  registerHandler(method: string, handler: IpcHandler): void {
    this.handlers.set(method, handler);
  }

  // 取消注册方法处理器
  unregisterHandler(method: string): void {
    this.handlers.delete(method);
  }

  // 订阅通知
  subscribe(topic: string, listener: (data: any) => void): { unsubscribe: () => void } {
    if (!this.notificationListeners.has(topic)) {
      this.notificationListeners.set(topic, new Set());
    }
    
    const listeners = this.notificationListeners.get(topic)!;
    listeners.add(listener);
    
    return {
      unsubscribe: () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.notificationListeners.delete(topic);
        }
      }
    };
  }

  // 获取连接的进程列表
  getConnectedProcesses(): { processId: string; processType: string }[] {
    return Array.from(this.connectedProcesses.entries())
      .map(([processId, info]) => ({ processId, processType: info.processType }));
  }

  // 获取当前进程ID
  getProcessId(): string {
    return this.processId;
  }

  // 获取当前进程类型
  getProcessType(): string {
    return this.processType;
  }
}

// 导出单例实例
export const ipcManager = new IpcManager();

// 导出类和类型
export { IpcManager, IpcMessageType };
export type { IpcHandler, IpcBaseMessage, IpcRequestMessage, IpcResponseMessage, IpcNotificationMessage, IpcErrorMessage, IpcHandshakeMessage };