type InjectClass<T = any> = new () => T;


export interface IContext {

    /**切换前台调用 */
    onShw?(param?: any): void;

    /**切换后台调用 */
    onHide?(param?: any): void;

    /**退出游戏调用一次 */
    onDispose?(): void;
}

export const ContextEvent = {
    SHOW: "onShow",
    HIDE: "onHide",
    DISPOSE: "onDispose",
}

export class Context {

    private injectMap = new Map<number, InjectClass>();
    private instanceMap = new Map<number, any>();

    //注入类
    INJECT<T>(classConstructor: InjectClass<T>) {
        const id = this.getGID(classConstructor);
        if (this.injectMap.has(id)) {
            this.log("Warning: Class already injected", classConstructor.name);
            return;
        }

        this.injectMap.set(id, classConstructor);
    }

    //取消注入
    UNINJECT<T>(classConstructor: InjectClass<T>) {
        const id = this.getGID(classConstructor);
        if (!this.injectMap.has(id)) {
            this.log("Warning: Class not injected", classConstructor.name);
            return;
        }

        this.injectMap.delete(id);
    }

    //获取实例
    GET<T>(classConstructor: InjectClass<T>): T {
        const id = this.getGID(classConstructor);
        if (!this.injectMap.has(id)) {
            throw new Error(`Class not injected: ${classConstructor.name}`);
        }

        let instance = this.instanceMap.get(id);
        if (instance) return instance;

        instance = new classConstructor();
        this.instanceMap.set(id, instance);
        return instance;
    }

    /**清理，参数不传清理所有 */
    CLEAR(classConstructor?: InjectClass) {
        if (classConstructor) {
            const id = this.getGID(classConstructor);
            // const instance = this.instanceMap.get(id);
            // if (instance && instance[ContextEvent.DISPOSE]) {
            //     instance[ContextEvent.DISPOSE]();
            // }
            this.instanceMap.delete(id);
            this.injectMap.delete(id);
            return;
        }

        // this.EVENT(ContextEvent.DISPOSE);

        this.instanceMap.clear();
        this.injectMap.clear();
    }

    EVENT(eventName: string, ...args: any[]) {
        for (const [id, instance] of this.instanceMap) {
            if (instance[eventName]) {
                instance[eventName](...args);
            }
        }
    }

    private getGID(classConstructor: InjectClass): number {
        let id = classConstructor["$__ID"];
        if (id === undefined || id === null) {
            id = this.gid();
            Reflect.defineProperty(classConstructor, "$__ID", { value: id, writable: false, enumerable: false, configurable: false });
        }
        return id;
    }

    private log(...args: any[]) {
        console.log("[Context]", ...args);
    }

    private gid = (function () {
        let id = 0;
        return function () {
            return ++id;
        };
    });
}
