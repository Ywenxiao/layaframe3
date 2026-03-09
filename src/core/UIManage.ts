/**
 * UI视图接口 - 实现此接口的类可被UI管理器管理
 */
export interface IView extends Laya.Sprite {
    /** UI实例创建后调用一次 */
    onInit?(): void;

    /** UI打开时调用 */
    onShow?(...args: any[]): void;

    /** UI隐藏时调用（从舞台移除但未销毁） */
    onHide?(): void;

    /** UI置顶时调用 */
    onTop?(): void;

    /** UI关闭时调用 */
    onClosed?(reason?: string): void;

    /** UI销毁时调用 */
    onDispose?(): void;

    /** UI事件（通过uiManage.emitUIEvent触发） */
    onUIEvent?(...args: any[]): void;

    /** 自定义数据 */
    data?: any;

    /** UI唯一标识 */
    uuid?: number;
}

/**
 * UI打开参数
 */
export interface UIOpenOptions {
    /** 传递给UI的数据 */
    data?: any[];

    /** UI名称 */
    name?: string;

    /** 层级，数值越大越在上层 */
    layer?: number;

    /** Z序 */
    zOrder?: number;

    /** 自定义父节点 */
    parent?: Laya.Sprite;

    /** 是否覆盖已打开的UI（如果为true，已打开的会先关闭） */
    overwrite?: boolean;

    /** 是否常驻（不会被自动销毁） */
    permanent?: boolean;

    /** 是否缓存UI实例（关闭后不销毁，可再次打开） */
    cache?: boolean;

    /** 预加载资源列表 */
    preloadResources?: string[];

    /** 是否等待预加载完成 */
    preload?: boolean;
}

/**
 * UI视图信息
 */
class ViewInfo {
    id: number = -1;
    ui: IView = null!;
    uiClass: UIContructor = null!;
    layer: number = 0;
    type: "view" | "item" = "view";
    group: number = 0;
    openTime: number = -1;
    closeTime: number = -1;
    permanent: boolean = false;
    cache: boolean = true;
    preloadResources: string[] = [];
    openToken: symbol | null = null;

    close(addTime: number = 0) {
        this.closeTime = Date.now() - addTime;
        this.openTime = -1;
        this.openToken = null;
    }

    open() {
        this.openTime = Date.now();
        this.closeTime = -1;
    }

    isOpen(): boolean {
        return this.openTime > 0;
    }

    isClose(): boolean {
        return this.closeTime > 0;
    }
}

/**
 * UI构造函数类型
 */
type UIContructor = new (...args: any[]) => IView;

/**
 * UI层级定义
 */
export class UILayer {
    /** 底层 */
    static Bottom: number = 10;

    /** 视图层 */
    static View: number = 20;

    /** 对话框层 */
    static Dialog: number = 30;

    /** 对话框顶层 */
    static DialogTop: number = 40;

    /** 特效层 */
    static Effect: number = 50;

    /** 引导层 */
    static Guide: number = 60;

    /** 顶层 */
    static Top: number = 70;

    static readonly layers: number[] = [
        UILayer.Bottom,
        UILayer.View,
        UILayer.Dialog,
        UILayer.DialogTop,
        UILayer.Effect,
        UILayer.Guide,
        UILayer.Top
    ];

    static hasLayer(layer: number): boolean {
        return UILayer.layers.includes(layer);
    }
}

/**
 * UI关闭/打开事件
 */
export interface UIEvent {
    uuid: number;
    view: IView;
    open: boolean;
    reason?: string;
}

/**
 * UI管理器 - 管理所有UI的生命周期
 * 用户可以完全控制UI的创建、显示、隐藏、关闭和销毁
 */
export class UIManage extends Laya.EventDispatcher {

    /** UI关闭事件 */
    static readonly EVENT_OPEN: string = "ui_open";
    static readonly EVENT_CLOSE: string = "ui_close";

    /** 默认UI缓存销毁时间（毫秒） */
    readonly defaultCacheDisposeTime: number = 10000;

    /** 所有打开的UI信息 */
    readonly views: Map<number, ViewInfo> = new Map();

    /** 等待打开的队列 */
    queueList: { ui: UIContructor, option: Partial<UIOpenOptions> }[] = [];

    /** 层级容器列表 */
    private layerMap: Map<number, Laya.Sprite> = new Map();

    /** UI计数器 */
    private uiCount: number = 0;

    /** 当前最顶层UI */
    private currTopView: number = -1;

    constructor() {
        super();
    }

    /**
     * 打开UI
     * @param ui UI类构造函数
     * @param options 打开选项
     */
    public async open<T extends IView>(ui: new () => T, options: Partial<UIOpenOptions> = {}): Promise<T | null> {
        if (!ui) {
            console.error("[UIManage] UI class is null");
            return null;
        }

        // 检查是否已打开
        if (this.isOpen(ui)) {
            if (options.overwrite !== true) {
                console.log("[UIManage] UI already open:", ui.name || ui.prototype.constructor.name);
                return this.getUI(ui) as T;
            }
            this.close(ui);
        }

        const info = this.getViewInfo(ui);
        const token = Symbol("open");
        info.openToken = token;
        info.open();

        // 设置选项
        info.permanent = !!options.permanent;
        info.group = 0;
        info.type = options.layer === 0 ? "item" : "view";
        info.preloadResources = options.preloadResources || [];
        info.cache = options.cache !== false;

        // 预加载资源
        if (options.preload !== false && info.preloadResources.length > 0) {
            await this.loadResources(info.preloadResources);
            // 检查是否被中断
            if (token !== info.openToken) {
                return null;
            }
        }

        // 创建或获取UI实例
        let view = info.ui;
        if (!view || (view as any).destroyed) {
            view = info.ui = new ui();
            this.initView(view, info);
            console.log("[UIManage] Create new UI:", view.name);
        }

        // 设置属性
        view.uuid = info.id;
        view.name = options.name || view.name || ui.name || ui.prototype.constructor.name;

        // 添加到层级
        const layer = options.layer || UILayer.View;
        if (options.parent) {
            info.layer = 0;
            options.parent.addChild(view);
        } else {
            info.layer = layer;
            view.zOrder = options.zOrder || 0;
            this.addToLayer(layer, view);
        }

        // 调用显示
        this.doShow(view, options.data);

        // 触发置顶事件
        if (info.type === "view") {
            this.onTopUI();
        }

        console.log("[UIManage] Open UI:", view.name);
        this.emit(UIManage.EVENT_OPEN, { uuid: info.id, view, open: true } as UIEvent);

        return view as T;
    }

    /**
     * 关闭UI
     * @param ui UI类构造函数或UUID或UI实例
     * @param reason 关闭原因
     */
    public close(ui: UIContructor | number | IView, reason?: string): void {
        let id: number;

        if (typeof ui === "number") {
            id = ui;
        } else if (ui instanceof Laya.Node) {
            id = (ui as IView).uuid || -1;
        } else {
            id = this.getGID(ui, false);
        }

        const info = this.views.get(id);
        if (!info || info.isClose()) {
            return;
        }

        // 触发置顶事件
        if (info.type === "view" && UILayer.hasLayer(info.layer)) {
            this.onTopUI();
        }

        // 设置关闭时间（缓存的UI延迟销毁）
        const offsetTime = info.cache ? 0 : this.defaultCacheDisposeTime - 1000;
        info.close(offsetTime);
        info.layer = -1;

        // 调用隐藏
        this.doHide(info.ui, reason);

        console.log("[UIManage] Close UI:", info.ui?.name, reason);
        this.emit(UIManage.EVENT_CLOSE, { uuid: id, view: info.ui, open: false, reason } as UIEvent);

        // 处理队列
        if (this.queueList.length > 0) {
            const next = this.queueList.shift()!;
            this.open(next.ui, next.option);
        }
    }

    /**
     * 销毁UI（立即销毁，不会延迟）
     * @param ui UI类构造函数或UUID或UI实例
     */
    public dispose(ui: UIContructor | number | IView): void {
        let id: number;

        if (typeof ui === "number") {
            id = ui;
        } else if (ui instanceof Laya.Node) {
            id = (ui as IView).uuid || -1;
        } else {
            id = this.getGID(ui, false);
        }

        const info = this.views.get(id);
        if (!info) {
            return;
        }

        // 先关闭
        this.close(id, "dispose");

        // 销毁UI
        if (info.ui && !(info.ui as any).destroyed) {
            this.doDispose(info.ui);
            info.ui.destroy();
        }

        // 清理资源
        this.clearResources(info);

        // 重置状态
        info.openTime = info.closeTime = -1;
        info.ui = null!;
    }

    /**
     * 隐藏UI（从舞台移除但不销毁，可再次显示）
     * @param ui UI类构造函数或UUID或UI实例
     */
    public hide(ui: UIContructor | number | IView): void {
        let id: number;

        if (typeof ui === "number") {
            id = ui;
        } else if (ui instanceof Laya.Node) {
            id = (ui as IView).uuid || -1;
        } else {
            id = this.getGID(ui, false);
        }

        const info = this.views.get(id);
        if (!info || info.isClose()) {
            return;
        }

        info.close(0);
        this.doHide(info.ui);

        // 重新置顶
        if (info.type === "view" && UILayer.hasLayer(info.layer)) {
            this.onTopUI();
        }
    }

    /**
     * 显示已隐藏的UI
     * @param ui UI类构造函数或UUID或UI实例
     * @param data 传递给UI的数据
     */
    public show(ui: UIContructor | number | IView, ...data: any[]): void {
        let id: number;

        if (typeof ui === "number") {
            id = ui;
        } else if (ui instanceof Laya.Node) {
            id = (ui as IView).uuid || -1;
        } else {
            id = this.getGID(ui, false);
        }

        const info = this.views.get(id);
        if (!info || info.isOpen()) {
            return;
        }

        // 重新打开
        info.open();

        // 重新添加到层级
        if (info.layer > 0) {
            this.addToLayer(info.layer, info.ui);
        }

        // 调用显示
        this.doShow(info.ui, data);

        // 置顶
        if (info.type === "view") {
            this.onTopUI();
        }
    }

    /**
     * 将UI加入打开队列
     * @param ui UI类构造函数
     * @param options 打开选项
     */
    public openQueue(ui: UIContructor, options: Partial<UIOpenOptions> = {}): void {
        this.queueList.push({ ui, option: options });
        if (this.queueList.length === 1) {
            this.open(ui, options);
        }
    }

    /**
     * 清空打开队列
     */
    public clearQueue(): void {
        this.queueList.length = 0;
    }

    /**
     * 关闭指定组的所有UI
     * @param group 组编号
     */
    public closeByGroup(group: number): void {
        this.views.forEach((info) => {
            if (info.group === group) {
                this.close(info.id);
            }
        });
    }

    /**
     * 关闭除指定组外的所有UI
     * @param exceptGroup 保留的组编号
     */
    public closeAllExcept(exceptGroup: number): void {
        this.views.forEach((info) => {
            if (info.group !== exceptGroup) {
                this.close(info.id);
            }
        });
    }

    /**
     * 关闭所有UI
     * @param clearData 是否清除所有UI数据
     */
    public closeAll(clearData: boolean = false): void {
        this.offAll();
        this.views.forEach((info) => {
            this.close(info.id);
        });

        // 销毁层级容器
        this.layerMap.forEach((layer) => {
            layer.destroy();
        });
        this.layerMap.clear();

        if (clearData) {
            this.views.clear();
        }

        this.currTopView = -1;
    }

    /**
     * 获取当前打开的UI实例
     * @param ui UI类构造函数
     */
    public getUI<T extends IView>(ui: UIContructor): T | null {
        const id = this.getGID(ui, false);
        const info = this.views.get(id);

        if (info && info.isOpen() && info.ui && !(info.ui as any).destroyed) {
            return info.ui as T;
        }

        return null;
    }

    /**
     * 判断UI是否已打开
     * @param ui UI类构造函数
     */
    public isOpen(ui: UIContructor): boolean {
        const id = this.getGID(ui, false);
        const info = this.views.get(id);
        return info ? info.isOpen() : false;
    }

    /**
     * 获取UI的UUID
     * @param ui UI类构造函数
     */
    public getUIId(ui: UIContructor): number {
        return this.getGID(ui, false);
    }

    /**
     * 获取层级容器
     * @param layer 层级
     */
    public getLayer(layer: number): Laya.Sprite | null {
        if (!UILayer.hasLayer(layer)) {
            console.warn("[UIManage] Invalid layer:", layer);
            return null;
        }

        let container = this.layerMap.get(layer);
        if (!container) {
            container = new Laya.Sprite();
            container.zOrder = layer;
            container.name = "layer_" + layer;
            Laya.stage.addChild(container);
            this.layerMap.set(layer, container);
        }

        return container;
    }

    /**
     * 设置层级是否可见
     * @param layer 层级
     * @param visible 是否可见
     */
    public setLayerVisible(layer: number, visible: boolean): void {
        const container = this.getLayer(layer);
        if (container) {
            container.visible = visible;
        }
    }

    /**
     * 隐藏指定层级以下的所有层级
     * @param layer 目标层级
     */
    public showOnlyLayer(layer: number): void {
        UILayer.layers.forEach((l) => {
            const container = this.getLayer(l);
            if (container) {
                container.visible = l >= layer;
            }
        });
    }

    /**
     * 恢复所有层级可见
     */
    public resetLayers(): void {
        UILayer.layers.forEach((l) => {
            const container = this.getLayer(l);
            if (container) {
                container.visible = true;
            }
        });
    }

    /**
     * 触发UI事件
     * @param ui UI类构造函数
     * @param args 事件参数
     */
    public emitUIEvent(ui: UIContructor, ...args: any[]): void {
        const view = this.getUI(ui);
        if (view && view.onUIEvent) {
            view.onUIEvent(...args);
        }
    }

    /**
     * 更新所有UI（每帧调用）
     */
    public update(): void {
        const now = Date.now();

        this.views.forEach((info) => {
            // 已打开的UI
            if (info.isOpen() && info.ui && !(info.ui as any).destroyed) {
                if (info.ui.onUpdateTime) {
                    info.ui.onUpdateTime();
                }
                return;
            }

            // 常驻UI不处理
            if (info.permanent) {
                return;
            }

            // 缓存的UI一段时间后自动销毁
            if (info.isClose() && info.ui && !(info.ui as any).destroyed && now - info.closeTime > this.defaultCacheDisposeTime) {
                console.log("[UIManage] Auto dispose UI:", info.ui.name);
                this.doDispose(info.ui);
                info.ui.destroy();
                this.clearResources(info);
                info.openTime = info.closeTime = -1;
                info.ui = null!;
            }
        });
    }

    // ================== 私有方法 ==================

    /** 初始化UI实例 */
    private initView(view: IView, info: ViewInfo): void {
        view.uuid = info.id;
    }

    /** 执行显示 */
    private doShow(view: IView, data?: any[]): void {
        if (view.onInit) {
            view.onInit();
        }
        if (view.onShow) {
            view.onShow(...(data || []));
        }
    }

    /** 执行隐藏 */
    private doHide(view: IView, reason?: string): void {
        view.removeSelf();
        if (view.onHide) {
            view.onHide();
        }
    }

    /** 执行关闭 */
    private doClose(view: IView, reason?: string): void {
        view.removeSelf();
        if (view.onClosed) {
            view.onClosed(reason);
        }
    }

    /** 执行销毁 */
    private doDispose(view: IView): void {
        if (view.onDispose) {
            view.onDispose();
        }
    }

    /** 添加到层级 */
    private addToLayer(layer: number, view: IView): void {
        const container = this.getLayer(layer);
        if (container) {
            container.addChild(view);
        }
    }

    /** 触发置顶UI事件 */
    private onTopUI(): void {
        Laya.timer.clear(this, this._onTopUI);
        Laya.timer.once(100, this, this._onTopUI);
    }

    private _onTopUI(): void {
        let topView: IView | null = null;
        let openTime: number = -1;
        let layer: number = -1;

        this.views.forEach((info) => {
            if (info.isOpen() && info.layer > 0 && info.ui && info.type === "view") {
                if (info.layer > layer || (layer === info.layer && info.openTime > openTime)) {
                    topView = info.ui;
                    openTime = info.openTime;
                    layer = info.layer;
                }
            }
        });

        if (topView && topView.uuid !== this.currTopView) {
            this.currTopView = topView.uuid!;
            if (topView.onTop) {
                topView.onTop();
            }
        }
    }

    /** 获取UI信息 */
    private getViewInfo(ui: UIContructor): ViewInfo {
        const id = this.getGID(ui);
        let info = this.views.get(id);
        if (!info) {
            info = new ViewInfo();
            info.id = id;
            info.uiClass = ui;
            this.views.set(id, info);
        }
        return info;
    }

    /** 获取或生成GID */
    private getGID(c: UIContructor, create: boolean = true): number {
        const desc = Object.getOwnPropertyDescriptor(c, "$__GID");

        if (desc && desc.value != null) {
            return desc.value;
        }

        if (!create) {
            return -1;
        }

        const id = ++this.uiCount;
        Object.defineProperty(c, "$__GID", {
            enumerable: false,
            writable: false,
            configurable: false,
            value: id
        });

        return id;
    }

    /** 加载资源 */
    private loadResources(resources: string[]): Promise<void> {
        return new Promise((resolve) => {
            if (!resources || resources.length <= 0) {
                resolve();
                return;
            }

            Laya.loader.load(resources, Laya.Handler.create(null, () => {
                resolve();
            }));
        });
    }

    /** 清理UI资源 */
    private clearResources(info: ViewInfo): void {
        // 可以在这里添加资源清理逻辑
        // 例如：检查引用计数，释放不再使用的资源
    }
}

/** 全局UI管理器单例 */
export const uiManage = new UIManage();
