import apk from "./apk";
import { WITHCONTEXT, INJECT } from "./Context";
import { ContextType } from "./DefineTypes";

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
    onClear?(reason: string): void;

    /**ui销毁调用一次 */
    onDispose?(): void;

    /**切换后台 */
    onGameHide?(res: any): void;

    /**切换前台 */
    onGameShow?(res: any): void;

    /**支付回调 */
    onPayCall?(result: any): void;

    /**UIManage.eventUI主动触发 */
    onUIEvent?(...args: any): void;

}

//UI界面打开信息
export class ViewInfo {

    private pms_ui: Promise<IView>

    /**页面唯一标识 */
    readonly id: number = -1;

    url: string;

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

    /**是否缓存,不缓存关闭后就清理 */
    cache: boolean = true;

    /** 防止并发冲突用的标记 */
    openToken: symbol | null;

    constructor() {
        ++this.id;
    }

    async generateView(): Promise<IView> {
        if (this.ui && !this.ui.destroyed) {
            logUI("generate ui from cache", this.url);
            return this.ui;
        }

        if (this.pms_ui) return this.pms_ui;

        logUI("generate ui from create", this.url);

        this.pms_ui = Laya.loader.load(this.url).then((p: Laya.Prefab) => {
            if (!p) {
                errUI("load ui error", this.url);
                return null;
            }

            this.ui = p.create() as IView;
            return this.ui as any;
        }).catch(() => {
            logUI("load ui error", this.url);
        }).finally(() => this.pms_ui = null);

        return this.pms_ui;

    }

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

    /**渲染排序 */
    zIndex: number;

    /**zOrder */
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

    /**扩展层 */
    static Extend: number = 80;

    static fomatArray() {
        return [UILayer.Bottom, UILayer.View, UILayer.Dialog, UILayer.DialogTop, UILayer.Spine, UILayer.Guide, UILayer.Top, UILayer.Extend];
    }

    static hasLayer(layer: number) {
        return UILayer.fomatArray().indexOf(layer) >= 0
    }
}


/**
 * UI管理脚本，管理所有使用CreateUI打开的UI的生命周期,用此脚本创建的ui会自动销毁并清理UI带的资源
 */
@INJECT(ContextType.SYSTEM, false)
export class UIManager extends WITHCONTEXT(Laya.EventDispatcher) {

    /**UI关闭事件 */
    public readonly CLOSE_OPEN = "ON_CLOSE";

    //UI默认缓存时间 ,10秒自动销毁
    public readonly defaultUIdisposeTime: number = 15000;

    //UI默认销毁计数
    public readonly defaultUIdisposeCount: number = 1;

    //当前UI信息
    public readonly uis: Map<string, ViewInfo> = new Map<string, ViewInfo>();

    //打开队列
    public queueList: { ui: string, option: Partial<UIOption> }[];

    //UI层级
    private layerList: { [layer: number]: Laya.Sprite };

    //累计打开ui数量
    private uiCount: number = 0;

    //当前顶层UI
    private currTopView: number;

    constructor() {
        super();
        this.queueList = [];
        this.layerList = {};
    }

    /**
     * 打开ui
     * @param ui  
     * @param option 
     * @returns void
     */
    public async CreateUI(url: string, option?: Partial<UIOption>) {

        //ui已经打开
        if (this.hasOpen(url)) {

            //不能重复打开
            if (option.overwrite !== true) {
                logUI("ui already open", url);
                return;
            }

            this.ClearUI(url);
        }

        option = option || {};

        let info = this.getUIinfo(url);
        let token = Symbol("open");
        info.openToken = token;
        info.permanent = option.permanent === true;
        info.group = option.group || 0;
        info.type = option.type || "view";
        info.cache = option.cache !== false;
        info.layer = option.layer || UILayer.Dialog;

        info.open();
        let view = await info.generateView();

        //多次重复打开
        if (token !== info.openToken) {
            logUI("replace ui open", url);
            return;
        }

        if (!view || view.destroyed) {
            errUI("create ui error", url);
            return;
        }

        //预加载资源
        if (option.perloader !== false) {
            //TODO
        }

        view.zIndex = option.zIndex ?? 0;
        view.zOrder = option.zOrder || 0;

        let parent = option.parent || this.getLayer(info.layer);
        parent.addChild(view);

        this.define_init(info);
        view.onShow?.(...(option.data || []));
        logUI("open ui", url);

        info.type === "view" && this.onTopUI();
    }

    //关闭UI
    public ClearUI(url: string, reason?: string) {

        let info = this.uis.get(url);

        //UI已经关闭
        if (!info || info.isClose()) {
            return;
        }

        info.type === "view" && UILayer.hasLayer(info.layer) && this.onTopUI();
        let offsetTm = info.cache ? 0 : this.defaultUIdisposeTime - 1000;
        info.layer = -1;
        info.close(offsetTm);
        info.ui["__close"](reason);
        logUI("close ui", url);
        if (this.queueList.length > 0 && this.queueList[0].ui === url) {
            this.queueList.shift();
            if (this.queueList.length > 0) {
                this.CreateUI(this.queueList[0].ui, this.queueList[0].option);
            }
        }

    }

    //在队列中打开
    public OpenQueue(url: string, option?: Partial<UIOption>) {
        this.queueList.push({ ui: url, option: option });
        if (this.queueList.length === 1) {
            this.CreateUI(url, option);
        }
    }

    public clearQueue() {
        this.queueList.length = 0;
    }


    //关闭一组UI
    public ClearuiByGroup(group: number) {
        this.uis.forEach((v, k) => {
            if (v.group === group) {
                this.ClearUI(v.url);
            }
        });
    }

    //关闭除了指定UI外的所有UI
    public ClearAllUIExcept(group: number) {
        this.uis.forEach((v, k) => {
            if (v.group !== group) {
                this.ClearUI(v.url);
            }
        });

    }

    /**关闭所有UI,并移除UI事件 */
    public ClearAll(clear: boolean = false) {

        this.offAll();
        this.uis.forEach(v => this.ClearUI(v.url));

        for (let key in this.layerList) {
            this.layerList[key]?.destroy();
        }
        this.layerList = {};
        clear && this.uis.clear();
        this.currTopView = -1;
    }


    public eventWaitUI(wait: number, url: string, args?: any[]) {
        if (wait <= 0) {
            this.eventUI(url, args);
            return;
        }

        Laya.timer.once(wait, this, this.eventUI, [url, args], false);
    }


    public eventUI(url: string, args?: any[]) {
        let view = this.getOpenUI(url);
        if (!view) return;

        args = args || [];
        view.onUIEvent && view.onUIEvent(...args);
    }

    public eventListUI(...uilist: string[]) {
        if (!uilist) return;

        uilist.forEach(v => this.eventUI(v));
    }

    public isTopView(view: number) {
        return this.currTopView === view;
    }

    public getLayer(layer: number) {
        if (UILayer.fomatArray().indexOf(layer) < 0) {
            errUI("错误的UI层级", layer);
            return;
        }
        if (!this.layerList[layer]) {
            let sp = this.layerList[layer] = new Laya.Sprite();
            sp.zOrder = layer;
            sp.name = "layer_" + layer;
            sp.x = this.getOffsetX();

            Laya.stage.addChild(sp);
        }

        return this.layerList[layer];
    }

    //获取打开的UI
    public getOpenUI(url: string) {
        let info = this.uis.get(url);
        if (info && info.isOpen() && info.ui && !info.ui.destroyed) {
            return info.ui;
        }

        return null;
    }

    /**
     * 停止渲染这个层级以下的UI,全屏界面可以调用这个隐藏底部层级
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

    // public async LoadUI(url: string, customList: any[]) {

    //     return new Promise<void>((resolve, reject) => {
    //         let done = () => {
    //             resolve();
    //         }

    //         if (!ui || !ui.uiView) {
    //             done();
    //             return;
    //         }

    //         if (typeof ui.uiView === "string") {
    //             ui.uiView = Laya.loader.getRes(ui.uiView);
    //         }

    //         if (!ui.uiView || ui.uiView.loadList.length <= 0) {
    //             done();
    //         }

    //         //筛选
    //         let list = ui.uiView.loadList.filter(v => !v.endsWith(".prefab"));

    //         list = list.concat(customList || []);

    //         Laya.loader.load(list, Laya.Handler.create(null, () => {
    //             done();
    //         }));
    //     })
    // }


    public updateTime() {

        this.uis.forEach((v, k) => {

            //UI已经打开
            if (this.hasOpen(v.url) && v.ui && !v.ui.destroyed) {

                v.ui.onUpdateTime && v.ui.onUpdateTime();
                return;
            }

            //常驻页面,不处理
            if (v.permanent === true) {
                return;
            }

            //一段时间没打开自动动销毁UI
            if (v.closeTime > 0 && v.ui && !v.ui.destroyed && Date.now() - v.closeTime > this.defaultUIdisposeTime) {

                logUI("dispose ui", v.ui?.name);
                (v.ui as any).__dispose();
                this.clearResByUI(v);

                v.openTime = v.closeTime = -1;
                v.ui = null;
                // this.destoreResCount++;
            }
        })

        // if (this.destoreResCount > 5) {

        //     this.clearResUnReference();
        // }
    }

    //state true切换前台 false切换后台
    public setGameState(state: boolean, res: any) {
        let callStr = state ? "onGameShow" : "onGameHide";
        console.log("切换状态", callStr);
        this.uis.forEach((v, k) => {
            //不存在UI实例不用处理
            if (this.hasOpen(v.url) && v.ui && !v.ui.destroyed) {
                v.ui[callStr] && v.ui[callStr](res);
            }
        })
    }

    public onPayCall(result: any) {

        // this.uis.forEach((v, k) => {
        //     //不存在UI实例不用处理
        //     if (this.hasOpen(v.id) && v.ui && !v.ui.destroyed) {
        //         v.ui.onPayCall && v.ui.onPayCall(result);
        //     }
        // })
    }


    /**是否已经打开 */
    private hasOpen(url: string) {

        let info = this.uis.get(url);
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

        // arr = arr.concat(uiInfo.perLoaderList || []);

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

        logUI("清理资源 clear ui res", len);
    }


    private getUIinfo(url: string): ViewInfo {
        let info = this.uis.get(url);
        if (!info) {
            info = new ViewInfo();
            info.url = url;
            this.uis.set(url, info);
        }

        return info;
    }


    private clearResUnReference() {


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

    private define_init(info: ViewInfo) {
        if (!info || !info.ui || info.id < 0) {
            errUI("define_init error", info?.url);
            return;
        }

        if (info.ui["uuid"] > 0) return;

        info.ui.onInit?.();

        this.d(info.ui, "uuid", info.id);
        let self = this;

        this.d(info.ui, "close", function (reason?: string) {
            self.ClearUI(info.url);
        })

        this.d(info.ui, "__close", function (reason?: string) {

            this.removeSelf();
            self.offAllCaller(this);

            // TODO
            // evm.offAllCaller(this);
            // badge.offAll(this);

            this.onClear && this.onClear(reason);
            self.event(self.CLOSE_OPEN, {
                uuid: this.uuid,
                view: this,
                open: false,
                reason: this.reason
            });
        })

        this.d(info.ui, "__dispose", function () {
            self.clearResByUI(info);
            this.onDispose?.();
            this.destroy();
        })

    }


    private d(o: any, k: string, v: any) {
        Reflect.defineProperty(o, k, {
            enumerable: true,
            writable: false,
            configurable: false,
            value: v
        })
    }


    private getOffsetX() {
        let offset = apk.getStageWidth() > 750 ? (apk.getStageWidth() - 750) / 2 : 0;
        this.getOffsetX = function () { return offset; }
        return offset;
    }


}

function logUI(...str: any[]) {
    console.log("[UI]", ...str);
}

function errUI(...str: any[]) {
    console.error("[UI]", ...str);
}
