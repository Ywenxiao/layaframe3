import AssetsMgr from "../core/AssetsManage";
import LogMgr from "./LogMgr";


type constructorView<T = IView> = new (...args: any[]) => T;

//UI打开关闭事件
export interface CloseOrOpenEvent {
    uuid: number;
    view: IView;
    open: boolean;
    reason?: string
}

//UI约束
export interface IView extends Laya.Sprite {

    /**ui实例调用一次 */
    onInit?(): void;

    /**ui打开调用一次 */
    onShow?(...args: any[]): void;

    /**ui置顶时调用一次 */
    onTop?(): void;

    /**ui打开时每秒调用 */
    onUpdateTime?(): void;

    /**ui关闭调用一次 */
    onClosed?(reason: string): void;

    /**ui销毁调用一次 */
    onDispose?(): void;

    /**游戏切换后台 */
    onGameHide?(res: any): void;

    /**游戏切换前台 */
    onGameShow?(res: any): void;

    /**支付回调 */
    // onPayCall?(result: any): void;

    /**UIManage.eventUI主动触发 */
    onUIEvent?(...args: any): void;

}

//UI界面打开信息
export class ViewInfo {
    /**页面唯一标识 */
    id: number = -1;

    /**ui实例 */
    ui: IView;

    /**ui界面类型 */
    uiView: constructorView;

    /**层级,大于0才有onTop事件 */
    layer: number = 0;

    /**item 没有 onTop事件 */
    type: "view" | "item";

    /**页面组 */
    group: number = 0;

    /**打开时间 */
    openTime: number = -1;

    /**关闭时间 */
    closeTime: number = -1;

    /**是否常驻 */
    permanent: boolean = false;

    /**依赖资源 */
    perLoaderList: any[] = [];

    /**是否缓存 */
    cache: boolean = true;

    /** 防止并发冲突用的标记 */
    openToken: symbol | null;

    close(addTime: number = 0) {
        this.closeTime = Date.now() - addTime;
        this.openTime = -1;
        this.openToken = null;
    }

    open() {
        this.openTime = Date.now();
        this.closeTime = -1;
    }

    isOpen() {
        return this.openTime > 0;
    }

    isClose() {
        return this.closeTime > 0;
    }
}


//UI打开参数
export interface UIOption {

    /**携带参数 */
    data: any[];

    /**ui名称 */
    name: string;

    /**页面组 */
    group: number;

    /**view-普通UI界面，item-当作一个UI组件用 item没有onTop事件*/
    type: "view" | "item";

    /**层级 */
    layer: number;

    /**渲染层级标识，相同标识的再同一层级 */
    zOrder: number;

    /**自定义父节点 */
    parent: Laya.Sprite;

    /**为true时如果已经打开会先关闭当前实例，再重新打开 default:false*/
    overwrite: boolean;

    /**常驻界面，不会被销毁 default:false*/
    permanent: boolean;

    /**是否是预加载,等加载完成再打开界面 default:true */
    perloader: boolean;

    /**替换cdn */
    replaceCdn: string;

    /**替换cdn */
    toCdn: string;

    /**自定义加载资源 */
    perLoaderList: any[];

    /**是否缓存,不缓存UI关闭立马destroy default:true */
    cache: boolean;
}

export class UILayer {

    /**最底层 */
    static Bottom: number = 10;

    /**VIEW层 */
    static View: number = 20;

    /**DIALOG层 */
    static Dialog: number = 30;

    /**DIALOG顶层 */
    static DialogTop: number = 40;

    /**特效层 */
    static Spine: number = 50;

    /**引导层 */
    static Guide: number = 60;

    /**顶层 */
    static Top: number = 70;

    static fomatArray() {
        return [UILayer.Bottom, UILayer.View, UILayer.Dialog, UILayer.DialogTop, UILayer.Spine, UILayer.Guide, UILayer.Top];
    }

    static hasLayer(layer: number) {
        return UILayer.fomatArray().indexOf(layer) >= 0
    }
}


/**
 * UI管理脚本，管理所有使用CreateUI打开的UI的生命周期,用此脚本创建的ui会自动销毁并清理UI带的资源
 */
class UIManager extends Laya.EventDispatcher {

    /**UI关闭事件 */
    public readonly CLOSE_OPEN = "ON_CLOSE";

    //UI默认缓存时间 ,10秒自动销毁
    public readonly defaultUIdisposeTime: number = 15000;

    //UI默认销毁计数
    public readonly defaultUIdisposeCount: number = 1;

    //当前UI信息
    public readonly uis: Map<number, ViewInfo> = new Map<number, ViewInfo>();

    public queueList: { ui: any, option: Partial<UIOption> }[] = [];

    private layerList: { [layer: number]: Laya.Sprite } = {};

    //累计打开ui数量
    private uiCount: number = 0;

    //当前顶层UI
    private currTopView: number;

    private lastDestoreRes = 0;
    private destoreResCount = 0;

    constructor() {
        super();
        this.lastDestoreRes = Date.now() + 60 * 3 * 1000;
    }

    /**
     * 打开ui
     * @param ui  
     * @param option 
     * @returns void
     */
    public async CreateUI(ui: constructorView, option?: Partial<UIOption>) {

        if (!ui) {
            this.errUI("ui is null");
            return;
        }


        //ui已经打开
        if (this.hasOpen(ui)) {

            //不能重复打开
            if (option.overwrite !== true) {
                this.logUI("ui already open", ui.name);
                return;
            }

            this.ClearUI(ui);
        }

        option = option || {};

        let info = this.getUIinfo(ui);
        let token = Symbol("open");
        info.openToken = token;

        info.open();

        info.permanent = !!option.permanent;
        info.group = option.group || 0;
        info.type = option.type || "view";
        info.perLoaderList = option.perLoaderList || [];
        info.cache = option.cache !== false;

        if (option.perloader !== false) {
            await this.LoadUI(ui, info.perLoaderList);

            //已经被替换
            if (token !== info.openToken) {
                return;
            }
        }


        let view = info.ui;
        if (!view || view.destroyed) {
            view = info.ui = new (this.classView(ui))(option);
            this.logUI("create new ui", ui.name);
        }

        (<any>view).uuid = info.id;
        view.name = option.name || ui.name;

        let layer = option.layer || UILayer.View;

        let isAwake = (view as any)._getBit(Laya.NodeFlags.AWAKED);

        //自定义父节点 layer参数不生效
        if (option.parent) {
            info.layer = 0;
            option.parent.addChild(view);

        } else {
            info.layer = layer;
            view.zOrder = option.zOrder || 0;
            this.addChild(layer, view);
        }

        this.logUI("open ui", view.name);
        (view as any).__open(option, isAwake);

        info.type === "view" && this.onTopUI();
    }

    //关闭UI
    public ClearUI(ui: constructorView | number) {

        let id = typeof ui == "number" ? ui : this.getGID(ui, false);
        let info = this.uis.get(id);

        //UI已经关闭
        if (!info || info.isClose()) {
            return;
        }

        info.type === "view" && UILayer.hasLayer(info.layer) && this.onTopUI();
        let offsetTm = info.cache ? 0 : this.defaultUIdisposeTime - 1000;
        info.close(offsetTm);
        info.layer = -1;

        this.logUI("close ui", info.ui?.name);
        (info.ui as any)?.__close();

        if (this.queueList.length > 0 && this.getGID(this.queueList[0].ui) === id) {
            this.queueList.shift();
            if (this.queueList.length > 0) {
                this.CreateUI(this.queueList[0].ui, this.queueList[0].option);
            }
        }

    }

    //在队列中打开
    public OpenQueue(ui: constructorView, option?: Partial<UIOption>) {
        this.queueList.push({ ui: ui, option: option });
        if (this.queueList.length === 1) {
            this.CreateUI(ui, option);
        }
    }

    public clearQueue() {
        this.queueList.length = 0;
    }


    //关闭一组UI
    public ClearuiByGroup(group: number) {
        this.uis.forEach((v, k) => {
            if (v.group === group) {
                this.ClearUI(v.id);
            }
        });
    }

    //关闭除了指定UI外的所有UI
    public ClearAllUIExcept(group: number) {
        this.uis.forEach((v, k) => {
            if (v.group !== group) {
                this.ClearUI(v.id);
            }
        });

    }

    /**关闭所有UI,并移除UI事件 */
    public ClearAll(clear: boolean = false) {

        this.offAll();
        this.uis.forEach(v => this.ClearUI(v.id));

        for (let key in this.layerList) {
            this.layerList[key]?.destroy();
        }
        this.layerList = {};
        clear && this.uis.clear();
        this.currTopView = -1;
    }


    public eventUI(ui: constructorView, args?: any[]) {
        let view = this.getOpenUI(ui);
        if (!view) return;

        args = args || [];
        view.onUIEvent && view.onUIEvent(...args);
    }

    public eventListUI(...uilist: constructorView[]) {
        if (!uilist) return;

        uilist.forEach(v => this.eventUI(v));
    }

    public isTopView(view: number) {
        return this.currTopView === view;
    }

    public getLayer(layer: number) {
        if (UILayer.fomatArray().indexOf(layer) < 0) {
            // warnning.showTipStr("错误的UI层级");
            return;
        }
        if (!this.layerList[layer]) {
            let sp = this.layerList[layer] = new Laya.Sprite();
            sp.zOrder = layer;
            sp.name = "layer_" + layer;

            // if (Laya.stage.width === conf.ipad_width) {
            //     sp.x = (conf.ipad_width - 750) / 2;
            // }

            Laya.stage.addChild(sp);
        }

        return this.layerList[layer];
    }

    //获取打开的UI
    public getOpenUI(ui: constructorView) {
        let info = this.uis.get(this.getGID(ui, false));

        if (info && info.openTime > 0 && info.ui && !info.ui.destroyed) {
            return info.ui;
        }

        return null;
    }

    /**
     * 停止渲染这个层级以下的UI
     * @param layer 
     * @returns 
     */
    public setActiveLayer(layer: number) {
        let layersp = UILayer.hasLayer(layer)
        if (!layersp) return;

        if (!UILayer.hasLayer(layer)) return;

        for (let key of UILayer.fomatArray()) {
            if (layer > key) {
                let sp = this.getLayer(key);
                sp && (sp.visible = false);
            }
        }
    }

    //复原渲染层级
    public resetLayer() {
        for (let key of UILayer.fomatArray()) {
            let sp = this.getLayer(key);
            sp && (sp.visible = true);
        }
    }

    public LoadUI(ui: any, customList: any[], callback?: Laya.Handler) {

        return new Promise<void>((resolve, reject) => {
            let done = () => {
                resolve();
                callback && callback.run();
                callback = null;
            }

            if (!ui || !ui.uiView) {
                done();
                return;
            }

            if (typeof ui.uiView === "string") {
                ui.uiView = Laya.loader.getRes(ui.uiView);
            }

            if (!ui.uiView || ui.uiView.loadList.length <= 0) {
                done();
            }

            //筛选
            let list = ui.uiView.loadList.filter(v => !v.endsWith(".prefab"));

            list = list.concat(customList || []);

            Laya.loader.load(list, Laya.Handler.create(null, () => {
                done();
            }));
        })
    }


    public updateTime() {

        this.uis.forEach((v, k) => {

            //UI已经打开
            if (this.hasOpen(v.id) && v.ui && !v.ui.destroyed) {

                v.ui.onUpdateTime && v.ui.onUpdateTime();
                return;
            }

            //常驻页面,不处理
            if (v.permanent === true) {
                return;
            }

            //一段时间没打开自动动销毁UI
            if (v.closeTime > 0 && v.ui && !v.ui.destroyed && Date.now() - v.closeTime > this.defaultUIdisposeTime) {

                this.logUI("dispose ui", v.ui?.name);
                (v.ui as any).__dispose();
                this.clearResByUI(v);

                v.openTime = v.closeTime = -1;
                v.ui = null;
                this.destoreResCount++;
            }
        })

        if (this.destoreResCount > 5) {

            this.clearResUnReference();
        }
    }

    //state true切换前台 false切换后台
    public setGameState(state: boolean, res: any) {
        let callStr = state ? "onGameShow" : "onGameHide";
        console.log("切换状态", callStr);
        this.uis.forEach((v, k) => {
            //不存在UI实例不用处理
            if (this.hasOpen(v.id) && v.ui && !v.ui.destroyed) {
                v.ui[callStr] && v.ui[callStr](res);
            }
        })
    }

    // public onPayCall(result: any) {

    //     this.uis.forEach((v, k) => {

    //         //不存在UI实例不用处理
    //         if (this.hasOpen(v.id) && v.ui && !v.ui.destroyed) {
    //             v.ui.onPayCall && v.ui.onPayCall(result);
    //         }
    //     })
    // }

    public getGID(c: constructorView, create: boolean = true): number {
        const v = Object.getOwnPropertyDescriptor(c, "$__GID");

        if (v != null && v.value != null) {
            return v.value;
        }

        if (!create) {
            return -1;
        }

        let num = this.getID();
        Object.defineProperty(c, "$__GID", {
            enumerable: true,
            writable: false,
            configurable: false,
            value: num
        })

        return num;
    }


    /**是否已经打开 */
    private hasOpen(ui: constructorView | number) {

        let id = typeof ui == "number" ? ui : this.getGID(ui, false);
        let info = this.uis.get(id);
        if (!info) return false;

        return info.isOpen();
    }


    /**
     * 清理UI资源，调用尽量频率低一点
     * @param ui ui
     * @param no_arr 不需要清理的资源 
     * @returns 
     */
    private clearResByUI(uiInfo: ViewInfo) {

        let arr = [];
        let ui = uiInfo.uiView;

        if (ui && ui["uiView"]) {
            arr = ui["uiView"].loadList || [];
        }

        arr = arr.concat(uiInfo.perLoaderList || []);

        if (!arr || arr.length <= 0) return;

        // let clear_arr = [];
        let len = 0;
        for (let elm of arr) {

            let url = null;
            if (typeof elm === "string") {
                url = elm;
            } else if (typeof elm === "object") {
                url = elm.url;
            }

            if (!url || url.indexOf("cdn/") < 0) continue;

            let res = Laya.loader.getRes(url);
            if (!res || res._referenceCount > 0) continue;

            Laya.loader.clearRes(url);
            len++;
            // clear_arr.push(url);
        }

        this.logUI("清理资源 clear ui res", len);
    }


    private getUIinfo(ui: constructorView): ViewInfo {
        let id = this.getGID(ui);
        let info = this.uis.get(id);
        if (!info) {
            info = new ViewInfo();
            info.id = id;
            info.uiView = ui;
            this.uis.set(id, info);
        }

        return info;
    }



    private classView(baseUI: constructorView) {

        return class extends baseUI {

            private __data: any[];

            private uuid: number;
            private reason: string;

            constructor(option: Partial<UIOption>) {
                super();
                this.__data = option.data || [];
            }

            onAwake(): void {
                this.onInit && this.onInit();
                this.__open2();
            }

            __open(option: Partial<UIOption>, isAwake: boolean) {
                //携带参数
                this.__data = option.data || [];

                if (isAwake) {
                    this.__open2();
                }
            }

            __open2() {
                this.onShow && this.onShow(...this.__data);
                this.onUpdateTime && this.onUpdateTime();
                UIManage.event(UIManage.CLOSE_OPEN, {
                    uuid: this.uuid,
                    view: this,
                    open: true
                });
            }

            __close() {
                this.removeSelf();
                // evm.offAllCaller(this);
                UIManage.offAllCaller(this);
                // badge.offAll(this);

                this.onClosed && this.onClosed(this.reason);
                UIManage.event(UIManage.CLOSE_OPEN, {
                    uuid: this.uuid,
                    view: this,
                    open: false,
                    reason: this.reason
                });
                this.reason = null;

            }

            __dispose() {

                this.onDispose && this.onDispose();
                // try {
                this.destroy();
                // } catch (e) {
                //     console.error(e);
                // }
            }

            close(reason?: string) {
                this.reason = reason;
                UIManage.ClearUI(this.uuid);
            }

            isTop() {
                return UIManage.isTopView(this.uuid);
            }
        }

    }




    private getID() {
        // let id = ++this.uiCount;
        // this.logUI("get id", id);
        // return id;
        return ++this.uiCount;

    };



    private clearResUnReference() {

        if (this.destoreResCount <= 0) {
            return;
        }

        if (this.lastDestoreRes > Date.now()) {
            return;
        }

        //三分钟内只处理一次
        this.lastDestoreRes = Date.now() + 60 * 3 * 1000;
        this.destoreResCount = 0;

        AssetsMgr.clearAllRes(100)
    }

    private addChild(layer: number, ui: Laya.Sprite) {

        let layerSp = this.getLayer(layer);
        if (!layerSp) return;
        layerSp.addChild(ui);
    }

    private onTopUI() {
        Laya.timer.clear(this, this._onTopUI);
        Laya.timer.once(100, this, this._onTopUI);
    }

    private _onTopUI(this: UIManager) {
        let view: IView = null, openTime: number = -1, layer: number = -1;

        this.uis.forEach((v, k) => {
            if (v.openTime > 0 && v.layer > 0 && v.ui && v.type === "view") {
                if (v.layer > layer || (layer === v.layer && v.openTime > openTime)) {
                    view = v.ui;
                    openTime = v.openTime;
                    layer = v.layer;
                }
            }
        });

        if (view && view["uuid"] !== this.currTopView) {
            this.currTopView = view["uuid"];
            view.onTop?.();
        }
    }

    private logUI(...str: any[]) {
        LogMgr.log("[UI]", ...str);
    }

    private errUI(...str: any[]) {
        console.error("[UI]", ...str);
    }
}

export let UIManage = new UIManager();