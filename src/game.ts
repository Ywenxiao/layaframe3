import { SoundManage } from "src/core/SoundManage";
import { BadgeManage } from "./core/BadgeManage";
import UIManage from "./core/UIManage";
import AniManage from "./core/AniManage";
import LogMgr from "./core/LogMgr";
import app from "./app";

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
class Game extends Laya.EventDispatcher {

    /** 模块实例缓存 */
    private _modules = new Map<string, any>();

    /** 模块配置 */
    private _configs: Record<string, ModuleConfig<any>> = {};

    constructor() {
        super();
        this.__initConfigs();
        this.__initEagerModules();
    }

    /**
     * 初始化模块配置
     */
    private __initConfigs(): void {
        this._configs = {
            SOUND: { clazz: SoundManage, lazy: false },
            BADGE: { clazz: BadgeManage, lazy: false },
            UI: { clazz: UIManage, lazy: false },
            ANI: { clazz: AniManage, lazy: false },
            LOG: { clazz: LogMgr, lazy: true },
            APP: { clazz: app, lazy: false }
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

    getItem(key: string): string {
        return "";
    }

    // ==================== 快捷访问器 ====================

    /** 声音管理器 */
    public get SOUND(): SoundManage { return this.getModule("SOUND"); }

    /** 红点管理器 */
    public get BADGE(): BadgeManage { return this.getModule("BADGE"); }

    /** UI管理器 */
    public get UI(): UIManage { return this.getModule("UI"); }

    /** 动画管理器 */
    public get ANI(): AniManage { return this.getModule("ANI"); }

    /**多平台管理器 */
    public get APP(): app { return this.getModule("APP"); }
}

/** 游戏单例实例 */
export const game = new Game();

/** 快捷导出 - 模块实例 */
export const SOUND = game.SOUND;
export const BADGE = game.BADGE;
export const UI = game.UI;
export const ANI = game.ANI;
