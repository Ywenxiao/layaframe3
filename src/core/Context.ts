import { ContextType, IContext, isNil } from "./DefineTypes";
import LogMgr from "./LogMgr";

// type InjectClass<T = any> = new () => T;

type InjectClass<T = {}> = new (...args: any[]) => T;

type Constructor<T = {}> = new (...args: any[]) => T;

interface InjectorInfo {

    type: number;

    classConstructor: InjectClass;

    instance: any;

    active: boolean;
}


/**注入类继承此基类，可在内部获得 this.context 的类型提示 */
export abstract class Injectable implements IContext {
    readonly context!: Context;

    /**切换前台调用 */
    onShow?(param?: any): void;

    /**切换后台调用 */
    onHide?(param?: any): void;

    /**激活状态变化 */
    onActive?(active: boolean): void;

    /**退出游戏之前调用一次 */
    onDispose?(): void;
}

export class Context extends Laya.EventDispatcher {

    private static _instance: Context;
    public static get instance(): Context {
        if (!Context._instance) {
            Context._instance = new Context();
        }
        return Context._instance;
    }

    private injectMap = new Map<number, InjectorInfo>();
    private injectMapByName = new Map<string, number>();

    private constructor() {
        super();
        this.injectMap = new Map<number, InjectorInfo>();
    }

    inject<T>(classConstructor: InjectClass<T>, type: number = 1, lazy: boolean = true, name: string) {
        const id = getGID(classConstructor);
        if (this.injectMap.has(id)) {
            log("Warning: Class already injected", classConstructor.name);
            return;
        }

        let instance = null;
        if (lazy !== true) {
            instance = new classConstructor();
            this.d(instance);
        }

        let injectInfo: InjectorInfo = { type, classConstructor, instance, active: true };
        this.injectMap.set(id, injectInfo);
        if (name) {
            this.injectMapByName.set(name, id);
            LogMgr.log("inject", name);
        }
    }

    unInject<T>(classConstructor: InjectClass<T>) {
        const id = getGID(classConstructor);

        const element = this.injectMap.get(id);
        if (!element) {
            return;
        }

        element.instance?.onDispose?.();
        element.instance = null;

        this.injectMap.delete(id);
    }


    //获取实例
    get<T>(classConstructor: InjectClass<T>): T & { readonly context: Context } {
        const id = getGID(classConstructor);
        return this.getById(id);
    }

    getById(id: number) {
        const element = this.injectMap.get(id);
        if (!element) {
            throw new Error(`Class not injected id: ${id}`);
        }

        if (!element.instance) {
            element.instance = new element.classConstructor();
            this.d(element.instance);
        }

        return element.instance;
    }


    getByName<T>(name: string): any {
        const id = this.injectMapByName.get(name);
        if (!id) {
            throw new Error(`Class not injected: ${name}`);
        }

        return this.getById(id);
    }

    /**
     * 设置是否激活,非激活状态不会派发事件
     * @param active 
     */
    setActive(c: InjectClass, active: boolean) {
        const element = this.injectMap.get(getGID(c));
        if (element) {
            element.active = active;
        }
    }

    /**setActive */
    setActiveByType(type: number, active: boolean) {
        for (const [id, element] of this.injectMap) {
            if (element.type === type && element.active !== active) {
                element.active = active;
                this.dispatch("onActive", active);
            }
        }
    }


    //派发事件
    dispatch(event: keyof IContext, ...args: any[]) {

        for (const [id, element] of this.injectMap) {
            if (!element.active || !element.instance || !element.instance[event]) continue;

            element.instance[event]?.(...args);
        }
    }

    clear() {
        //TODO
        for (const [_, element] of this.injectMap) {
            element.instance?.onDispose?.();
            element.instance = null;
        }
        this.injectMap.clear();
    }


    private d(o: any) {
        if (o["context"] === Context.instance) return;

        Reflect.defineProperty(o, "context", {
            enumerable: false,
            writable: false,
            configurable: false,
            value: Context.instance
        })
    }
}

export function INJECT(type: ContextType, lazy: boolean = true, name?: string): ClassDecorator {
    return function (target: any) {
        Context.instance.inject(target, type, lazy, name);
    }
}

export function GET<T>(c: InjectClass<T>): T & { readonly context: Context } {

    return Context.instance.get(c);
}

/**清理，参数不传清理所有 */
export function UNINJECT(classConstructor?: InjectClass) {
    if (!classConstructor) {
        Context.instance.clear();
    } else {
        Context.instance.unInject(classConstructor);
    }
}

export function DISPATCH(event: keyof IContext, ...args: any[]) {
    Context.instance.dispatch(event, ...args);
}


export function WITHCONTEXT<TBase extends Constructor>(Base: TBase): new (...args: ConstructorParameters<TBase>) => InstanceType<TBase> & Injectable;
export function WITHCONTEXT(): typeof Injectable;
export function WITHCONTEXT(Base?: any) {
    if (isNil(Base)) return Injectable;

    class ContextInject extends Base implements Injectable {
    }

    return ContextInject;
}

function getGID(classConstructor: InjectClass): number {
    let id = classConstructor["$__ID"];
    if (id === undefined || id === null) {
        id = gid();
        Reflect.defineProperty(classConstructor, "$__ID", { value: id, writable: false, enumerable: false, configurable: false });
    }
    return id;
}

function log(...str: any[]) {
    LogMgr.log(...str);
}

const gid = (function () {
    let __id = 0;
    return function () {
        return ++__id;
    };
}());

