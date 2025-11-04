interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    engines?: {
        webHelper?: string;
    };
    main?: string;
    contributes?: {
        commands?: Array<{
            command: string;
            title: string;
            category?: string;
        }>;
        views?: Array<{
            id: string;
            name: string;
        }>;
    };
}
interface PluginContext {
    pluginId: string;
    extensionPath: string;
    subscriptions: {
        dispose(): void;
    }[];
    commands: {
        registerCommand(id: string, callback: (...args: any[]) => any): {
            dispose(): void;
        };
        executeCommand(id: string, ...args: any[]): Promise<any>;
    };
    storage: {
        get(key: string): Promise<any>;
        set(key: string, value: any): Promise<void>;
        remove(key: string): Promise<void>;
    };
    messaging: {
        sendMessage(message: any): Promise<any>;
        onMessage(callback: (message: any) => void): {
            dispose(): void;
        };
    };
}
type PluginActivateFunction = (context: PluginContext) => void | Promise<void>;
type PluginDeactivateFunction = () => void | Promise<void>;
interface PluginExports {
    activate: PluginActivateFunction;
    deactivate?: PluginDeactivateFunction;
}
interface LoadedPlugin {
    id: string;
    metadata: PluginMetadata;
    exports: PluginExports;
    context: PluginContext;
}
interface PluginError {
    pluginId: string;
    message: string;
    error: Error;
}
export type { PluginMetadata, PluginContext, PluginActivateFunction, PluginDeactivateFunction, PluginExports, LoadedPlugin, PluginError };
