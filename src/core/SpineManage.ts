import { INJECT, Injectable } from "./Context";
import { ContextType } from "./DefineTypes";
import LogMgr from "./LogMgr";

export type spineTemp = Laya.SpineTemplet;

export type spItem = Laya.SpineSkeleton;

interface IReferenceInfo {

    /**引用路径 */
    url: string;

    /**引用次数 */
    count: number;

    /**最后引用时间 */
    lastTime: number;

}


interface IShowSpine {

    /**父节点,默认为舞台 */
    parent?: Laya.Sprite;

    /**节点名字 */
    name?: string;

    /**节点位置 */
    x?: number;

    /**节点位置 */
    y?: number;

    /**播放动作 */
    act?: string | number;

    /**播放声音 */
    sound?: string;

    /**是否清除旧的动画 default false */
    clearOldSpine?: boolean;

    /**使用缓存池 default: true */
    useCache?: boolean;

    /**播放完成自动清理,loop为true时无效 default: true */
    remove?: boolean;

    /**zOrder default: 0,与olderIndex互斥 */
    zolder?: number

    /**渲染排序 */
    olderIndex?: number
}

interface ISpineOption {

    /**循环 default: true */
    loop?: boolean;

    /**播放完成回调,不要在回调中操作本身，自动回收可能会错乱 */
    call?: Function;

    /**开始播放/加载完成 时回调 */
    onStart?: Function;

    /**相同动作，覆盖上一次 default: false */
    force?: boolean;

    /**动画播放起始时间 */
    start?: number;

    /**动画播放结束时间 */
    end?: number;

    /**缩放 */
    scale?: number;

    /**锚点 */
    anchor?: Laya.Vector2;
}

export class SpineItem extends Laya.SpineSkeleton {

    private _spItem: Laya.Spine2DRenderNode = null;
    private _act: string | number = null;
    private _option: ISpineOption = null;
    private _autoPause: boolean = true;
    private _active: boolean = false;
    private _anchor: Laya.Vector2 = null;

    constructor(public readonly spinePath: string, tp?: spineTemp) {
        super();
        this._active = true;
        tp && this.init(tp);
    }

    init(tp: spineTemp) {

        if (this.destroyed) {
            return;
        }
        this.templet = tp;
        this._spItem = this["_spineComponent"];

        if (this._act === null || typeof this._act === "undefined") {
            return;
        }

        this.off(Laya.Event.DISPLAY, this, this.onAdd);
        this.off(Laya.Event.UNDISPLAY, this, this.onRemove);
        this.on(Laya.Event.DISPLAY, this, this.onAdd);
        this.on(Laya.Event.UNDISPLAY, this, this.onRemove);

        this.tryPlay(this._act, this._option);
    }

    tryPlay(act?: string | number, option?: ISpineOption) {
        if (!this._active || this.destroyed) {
            return;
        }

        act = act || 0;

        if (!this._spItem || !this.templet) {
            this._act = act;
            this._option = option;
            this._anchor = option?.anchor ? new Laya.Vector2(option.anchor.x, option.anchor.y) : null;
            return;
        }

        option = option || {};
        const loop = option.loop !== false;
        const force = option.force === true;
        const start = option.start || 0;
        const end = option.end || 0;
        const scale = option.scale || 1;

        let width = this.templet.width, height = this.templet.height;
        if (width < 1) width = 100;
        if (height < 1) height = 100;

        this.width = Math.round(width);
        this.height = Math.round(height);
        if (this._anchor) {
            this.anchor(this._anchor.x, this._anchor.y);
        } else {
            this.pivot(Math.round(this.templet.offsetX), Math.round(this.templet.offsetY));
        }

        this.scale(scale, scale);
        this.play(act, loop, force, start, end, false, false);
        this.event(Laya.Event.START);
        option.onStart && option.onStart();

        if (loop || !option.call) {
            return;
        }

        this.once(Laya.Event.STOPPED, this, () => {
            option.call && option.call();
            option.call = null;
        });
    }

    /**
     * removechild 自动隐藏，tryplay之前调用才生效
     * @param autoPause 
     */
    setAutoPause(autoPause: boolean) {
        this._autoPause = autoPause;
    }

    stop() {
        this._act = this._option = null;
        super.stop();
    }

    //TODO 未验证
    stopByTime(time: number) {
        let item = this._spItem;
        if (!item || this.destroyed) {
            return;
        }

        this.currentTime = time;
        this.stop();
    }

    paused() {
        if (!this._active || this.destroyed) {
            return;
        }

        super.paused();
        this._act = this._option = null;
    }

    resume() {
        if (!this._active || this.destroyed) {
            return;
        }

        super.resume();

        // let item = this._spItem;

        // if (item) {
        //     log("恢复播放=======>", this.spinePath);
        //     item.resume()
        // }
    }

    //获取插槽
    getSlot(slotName: string) {
        if (!this._spItem) {
            return null;
        }

        let slot = this._spItem.getSlotByName(slotName);
        return slot;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }
        log("destroy sk=======>", this.spinePath);

        this.event(Laya.Event.END);
        this.stop();
        this._spItem = null;
        this._act = null;
        this._option = null;
        this._active = false;
        super.destroy(true); // 确保子节点也被销毁
    }

    clear() {
        this.destroy();
    }

    setActive(active: boolean) {
        this._active = active;

        if (!active) {
            this.stop();
            this.removeSelf();
        }
    }

    get active() {
        return this._active;
    }

    private onRemove() {

        this._autoPause && this.paused();
    }

    private onAdd() {
        this._autoPause && this.resume();
    }

}

@INJECT(ContextType.SYSTEM, false)
export class Spinemanage extends Injectable {

    /**spine资源 */
    private spMap: Map<string, spineTemp | Promise<spineTemp>> = new Map<string, spineTemp | Promise<spineTemp>>();

    /**spine引用信息，释放资源时使用 */
    private spRefereInfo: Map<string, IReferenceInfo> = new Map<string, IReferenceInfo>();

    /**动画缓存池 */
    private spCacheList: Map<string, Set<SpineItem>> = new Map<string, Set<SpineItem>>();

    /**动画缓存池容量 */
    private readonly poolSize: number = 5;

    /**上次清理时间 */
    private oldDisposeTime: number = 0;

    constructor() {
        super();
        this.oldDisposeTime = Date.now();
    }

    /**
     * 预加载动画
     * @param url 动画路径(全路径带后缀)
     * @param callBack 加载完成回调
     * @returns 
     */
    loadSpine(url: string, callBack?: Function) {

        return this.loadSkelOrSk(url).then(res => {
            if (callBack) {
                callBack(res);
                callBack = null;
            }
            return res;
        })
    }

    /**
     * 创建动画
     * @param url 动画路径(全路径带后缀)
     * @returns 
     */
    createSk(url: string, useCache?: boolean): SpineItem {

        if (useCache) {
            let sp = this.getCacheSk(url);
            if (sp) {
                this.updateReferenceInfo(url, false);
                return sp;
            }
        }

        log("创建动画=======>", url);
        let sp = new SpineItem(url);

        this.loadSkelOrSk(url).then(res => {
            if (sp.destroyed) {
                return;
            }
            this.updateReferenceInfo(url, true);
            sp.init(res);
        }).catch(err => {
            console.error(err);
            sp.destroy();

        })

        return sp;
    }


    /**
     * 显示动画
     * @param url 动画路径(全路径带后缀),自动识别是否是3.8的版本
     * @param option 
     * @returns SpineItem
     */
    showAnim(url: string, option?: IShowSpine & ISpineOption): SpineItem {

        option = option || {};
        const parent = option.parent || Laya.stage;
        const name = option.name || "spine_node";
        const useCache = option.useCache !== false;
        const remove = option.remove !== false;
        const clearOldSpine = !!option.clearOldSpine;
        const x = option.x ?? 0, y = option.y ?? 0;

        let sp = parent.getChildByName(name) as SpineItem;

        if (!sp) {
            sp = this.createSk(url, useCache);

        } else if (!(sp instanceof SpineItem)) {
            //有其它同名节点
            throw new Error("repetition node:" + url);

        } else if (clearOldSpine) {
            //清理旧spine
            this.removeSpine(sp);
            sp = null;

        } else if (sp.spinePath !== url) {
            //spine改变
            log("spine url change: \n", sp.spinePath + "====>" + url);
            this.removeSpine(sp);
            sp = null;

        }

        if (!sp) {
            sp = this.createSk(url, useCache);

        }


        if (remove) {
            let call = option.call;
            option.call = () => {
                this.removeSpine(sp);
                call && call();
            }
        }

        if (option.olderIndex != null) {
            sp.zOrder = 0;
            parent.addChildAt(sp, option.olderIndex);
        } else {
            sp.zOrder = option.zolder || 0;
            parent.addChild(sp);
        }

        sp.name = name;
        sp.alpha = 1;
        sp.setActive(true);
        sp.pos(x, y);
        sp.tryPlay(option.act, option);

        return sp;
    }

    /**
     * 清理动画
     * @param parent 
     * @param name 
     * @returns 
     */
    clearAni(parent: Laya.Sprite, name?: string) {
        if (!parent || parent.destroyed) return;

        name = name || "spine_node";
        let sp = parent.getChildByName(name) as SpineItem;
        if (!sp) {
            return;
        }

        if (sp instanceof SpineItem) {
            // sp.clear();
            this.removeSpine(sp);
            return;
        }
    }

    disposeAni(parent: Laya.Sprite, name?: string) {
        if (!parent || parent.destroyed) return;

        name = name || "spine_node";
        let sp = parent.getChildByName(name) as SpineItem;
        if (!sp) {
            return;
        }

        if (sp instanceof SpineItem) {
            let url = sp.spinePath;
            sp.destroy();
            this.clearCache(url);
            let tp = this.spMap.get(url);
            if (tp instanceof Promise) {
                return;
            }

            tp.destroy();
        }
    }

    /**
     * 清理缓存池
     * @param url 不传全清
     */
    clearCache(url?: string) {
        if (!url) {
            this.spCacheList.forEach(list => {
                if (!list) {
                    return;
                }

                list.forEach(v => v.clear());
            })
            this.spCacheList.clear();
            log("清理缓存池=======>", "全部");
            return;
        }

        let list = this.spCacheList.get(url);
        if (list) {
            log("清理缓存池=======>", url);
            list.forEach(sp => {
                sp.clear();
            })
            this.spCacheList.delete(url);
        }
    }


    disposeByUrl(url: string) {
        this.clearCache(url);

        let templet = this.spMap.get(url);
        if (!templet) {
            return;
        }

        if (templet instanceof Promise) {
            return;
        }
        templet.destroy();
        this.spMap.delete(url);
    }

    /**
     * 销毁未引用资源
     */
    disposeUnreferenced() {
        this.spMap.forEach((v, k) => {
            if (v instanceof Promise) {
                return;
            }

            if (v.referenceCount <= 0) {
                v.destroy();
            }
        })
    }

    /**
     * 销毁所有动效资源
     */
    disposeAll() {
        this.spCacheList.forEach(list => {
            if (list) {
                list.forEach(v => v.destroy());
            }
        });
        this.spCacheList.clear();

        this.spMap.forEach((v, k) => {
            if (v instanceof Promise) {
                return;
            }
            v.destroy();
        })


        this.spMap.clear();
    }


    /**移除并缓存动画 */
    removeSpine(sp: SpineItem) {
        if (!sp || sp.destroyed) {
            // console.warn("spine已销毁:", sp?.spinePath);
            return;
        }

        if (!(sp instanceof SpineItem)) {
            console.warn("不是目标动画");
            return;
        }

        let list = this.spCacheList.get(sp.spinePath);
        if (!list) {
            list = new Set();
            this.spCacheList.set(sp.spinePath, list);
        } else if (list.size >= this.poolSize) {
            sp.clear();
            return;
        }
        log("removeSpine:", sp.spinePath);
        sp.setActive(false);
        list.add(sp);
    }


    updateTime() {

        if (this.spMap.size <= 0) return;

        let now = Date.now();
        if (!this.oldDisposeTime) {
            this.oldDisposeTime = now;
        }

        //30秒内仅处理一次
        if (now - this.oldDisposeTime < 30000) {
            return;
        }

        let deleatKeys: string[] = [];
        this.spRefereInfo.forEach((v, k) => {

            //一分钟内使用过不处理
            if (now - v.lastTime < 60000) {
                return;
            }
            this.clearCache(k);

            let item = this.spMap.get(k);
            if (!item || item instanceof Promise) {
                return;
            }

            if (item.referenceCount > 0) {
                return;
            }

            deleatKeys.push(k);
            item.destroy();
            this.spMap.delete(k);
        });

        if (deleatKeys.length > 0) {
            log("disposeUnreferenced", deleatKeys);
            deleatKeys.forEach(k => this.spRefereInfo.delete(k));
        }

        this.oldDisposeTime = now;
    }

    private getCacheSk(url: string) {
        let list = this.spCacheList.get(url);
        if (!list) {
            return null;
        }

        while (list.size > 0) {
            let sp: SpineItem = list.values().next().value;
            list.delete(sp);
            if (sp.destroyed || sp.active) {
                continue;
            }
            return sp;
        }

        return null;
    }

    private updateReferenceInfo(url: string, add: boolean) {
        let info = this.spRefereInfo.get(url);
        let now = Date.now();
        if (!info) {
            info = { url: url, count: add ? 1 : 0, lastTime: now };
            this.spRefereInfo.set(url, info);
        } else {
            info.count += add ? 1 : 0;
            info.lastTime = now;
        }
    }

    /**
     * 加载动画
     * @param url 动画路径（全路径），基于后缀区分动画版本
     * @param version 
     * @returns 
     */
    private loadSkelOrSk(url: string) {

        let cached = this.spMap.get(url);

        if (cached instanceof Promise) {
            return cached;
        }

        if (cached && !cached.destroyed) {
            return Promise.resolve(cached);
        }

        let loadPromise = Laya.loader.load(url, Laya.Loader.SPINE).then((res: Laya.SpineTemplet) => {
            if (res) {
                this.spMap.set(url, res);
                return res;
            } else {
                this.spMap.delete(url);
            }
        })

        this.spMap.set(url, loadPromise);

        return loadPromise;
    }

}

function log(...str: any[]) {
    LogMgr.log("[--Spine--]", ...str);
}
