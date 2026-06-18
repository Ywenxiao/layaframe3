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
export abstract class Injectable {
    readonly context!: Context;
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

    private constructor() {
        super();
        this.injectMap = new Map<number, InjectorInfo>();
    }

    inject<T>(classConstructor: InjectClass<T>, type: number = 1, lazy: boolean = true) {
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

        this.injectMap.set(id, {
            type,
            classConstructor,
            instance,
            active: true
        });
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
        const element = this.injectMap.get(id);
        if (!element) {
            throw new Error(`Class not injected: ${classConstructor?.name}`);
        }

        if (!element.instance) {
            element.instance = new classConstructor();
            this.d(element.instance);
        }

        return element.instance;
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

export function INJECT(type: ContextType, lazy: boolean = true): ClassDecorator {
    return function (target: any) { Context.instance.inject(target, type, lazy); };
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


export function WITHCONTEXT<TBase extends Constructor>(Base: TBase): new (...args: ConstructorParameters<TBase>) => InstanceType<TBase> & { readonly context: Context };
export function WITHCONTEXT(): typeof Injectable;
export function WITHCONTEXT(Base?: any) {
    if (isNil(Base)) return Injectable;
    
    class ContextInject extends Base {
        readonly context!: Context;
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

