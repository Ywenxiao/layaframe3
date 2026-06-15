import { BadgeManage } from "./core/BadgeManage";
import { UIManager } from "./core/UIManage";
import AniManage from "./core/AniManage";
import LogMgr from "./core/LogMgr";
import apk from "./core/apk";
import SoundManager from "./core/SoundManager";

/**
 * 模块类型定义
 */
type ModuleClass<T = any> = { new(): T };

/**
 * 模块配置项
 */
interface ModuleConfig<T> {
    /** 模块类 */
    clazz: ModuleClass<T>;
    /** 是否懒加载 */
    lazy?: boolean;
}

/**
 * 游戏核心模块管理器
 * 统一管理所有单例模块
 */
export class Game extends Laya.EventDispatcher {

    private static _instance: Game = null;
    static get I(): Game {
        return this._instance || (this._instance = new Game());
    }

    /** 模块实例缓存 */
    private _modules = new Map<string, any>();

    /** 模块配置 */
    private _configs: Record<string, ModuleConfig<any>> = {};

    private constructor() {
        super();
        this.__initConfigs();
        this.__initEagerModules();
    }


    /** 声音管理器 */
    public get SOUND(): SoundManager { return this.getModule("SOUND"); }

    /** 红点管理器 */
    public get BADGE(): BadgeManage { return this.getModule("BADGE"); }

    /** UI管理器 */
    public get UI(): UIManager { return this.getModule("UI"); }

    /** 动画管理器 */
    public get ANI(): AniManage { return this.getModule("ANI"); }

    /**多平台管理器 */
    public get APP(): apk { return this.getModule("APP"); }

    /**
     * 初始化模块配置
     */
    private __initConfigs(): void {
        this._configs = {
            SOUND: { clazz: SoundManager, lazy: false },
            BADGE: { clazz: BadgeManage, lazy: false },
            UI: { clazz: UIManager, lazy: false },
            ANI: { clazz: AniManage, lazy: false },
            LOG: { clazz: LogMgr, lazy: true },
            APP: { clazz: apk, lazy: false }
        };
    }

    /**
   * 初始化非懒加载模块
   */
    private __initEagerModules(): void {
        for (const [key, config] of Object.entries(this._configs)) {
            if (!config.lazy) {
                this.getModule(key);
            }
        }
    }

    /**
     * 获取模块实例
     */
    private getModule<T>(key: string): T {
        let instance = this._modules.get(key);
        if (!instance) {
            const config = this._configs[key];
            if (!config) {
                throw new Error(`Module "${key}" not found`);
            }
            instance = new config.clazz();
            this._modules.set(key, instance);
        }
        return instance;
    }
}