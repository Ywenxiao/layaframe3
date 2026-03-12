import { UIUtils } from "../utils/UIUtils";

/**
 * 红点事件/委托
 */
export interface BadgeAction {
    caller?: any;
    ages?: any[];

    /**检测红点 */
    method?(ages?: any): boolean | number;
}

/**红点节点 */
export class BadgeNode {

    /**节点值 */
    value: boolean | number = null;

    /**节点内容 */
    key: string;

    /**节点组 */
    group: string | number;

    /**节点委托方法 */
    action: BadgeAction;

    /**更新节点值，返回是否变化 */
    update() {
        let oldV = this.value;
        this.value = this.actionConst;

        return oldV !== this.value;
    }

    get flag() {
        return this.value === true || this.value as number > 0;
    }

    get actionConst(): boolean | number {
        if (!this.action) {
            return false;
        }

        return this.action.method.apply(this.action.caller, this.action.ages);
    }
}

/**红点实列，可以监听多个红点 */
export class BadgeView {

    //监听的类型
    private types = new Set<string>();

    /**监听的UI */
    view: Laya.Sprite;

    //标识，方便批量移除
    caller: any;

    //红点位置
    badge_pos: { x: number, y: number } = null;

    //红点大小
    badge_size: { x: number, y: number } = null;

    //反转
    reverse: boolean = false;

    static create(): BadgeView {
        return Laya.Pool.getItemByClass("__badgeview", BadgeView);
        // return new BadgeView();
    }

    add(v: string) {
        this.types.add(v);
    }

    remove(v: string) {
        return this.types.delete(v);
    }

    has(v: string) {
        return this.types.has(v);
    }

    isEmpty() {
        return this.types.size <= 0;
    }

    recover() {
        this.clear();
    }

    clear() {
        UIUtils.setBadge(this.view, false);
        this.view = null;
        this.types.clear();
        Laya.Pool.recover("__badgeview", this);
    }


    get array() {
        return Array.from(this.types);
    }
}

export class BadgeManage {

    /**图鉴红点 */
    ACHIEVEMENT = "ACHIEVEMENT";

    /**七日签到 */
    SIGNIN = "SIGNIN";

    /**建造红点 */
    BUILD = "BUILD";

    /**活动9009 */
    ACTION_9009 = "ACTION_9009";

    /**1+1礼包 */
    ACTION_9002 = "ACTION_9002";

    /**每日任务 */
    ACTION_EVERY_TASK = "ACTION_EVERY_TASK";

    /**活动20001 */
    ACTION_20001 = "ACTION_20001";

    /**活动1917 */
    ACTION_1917 = "ACTION_1917";

    /**活动1926 */
    ACTION_1926 = "ACTION_1926";

    /**活动1917 */
    ACTION_1903 = "ACTION_1903";

    /**活动9013 */
    ACTION_9013 = "ACTION_9013";

    /**活动8003 */
    ACTION_8003 = "ACTION_8003";

    /**活动8003 */
    ACTION_1931 = "ACTION_1931";

    /**活动1824 */
    ACTION_1824 = "ACTION_1824";

    ACTION_1928 = "ACTION_1928";

    /**活动1819 */
    ACTION_1819 = "ACTION_1819";

    ACTION_8005 = "ACTION_8005";

    /**感恩有你礼包 */
    ACTION_9004 = "ACTION_9004";

    /**活动9001 */
    ACTION_9001 = "ACTION_9001";

    /**活动1925 */
    ACTION_1925 = "ACTION_1925";

    /**活动8009 */
    ACTION_8009 = "ACTION_8009";

    /**活动8008 */
    ACTION_8008 = "ACTION_8008";

    /**活动1946 */
    ACTION_1946 = "ACTION_1946";

    /**活动8010 */
    ACTION_8010 = "ACTION_8010";

    /**活动20010 */
    ACTION_20010 = "ACTION_20010";

    /**旋转礼包 */
    ACTION_1801 = "ACTION_1801";

    /**1+2礼包 */
    ACTION_20013 = "ACTION_20013";

    /**活动20015 */
    ACTION_20015 = "ACTION_20015";

    /**邮件 */
    MAIL = "MAIL";

    //==============================平台相关=======================================

    /**淘宝复访 */
    TAOBAO_PUSH = "TAOBAO_PUSH";

    /**抖音福利 */
    TT_FULI = "TT_FULI";

    /**脑洞小游戏 */
    TT_FULI_2 = "TT_FULI_2";

    /**支付宝PC端登录 */
    ALI_PC = "ALI_PC";

    /**支付宝福利 */
    ALI_FULI = "ALI_FULI";


    //=====================================================================


    /**节点池 */
    private _badges = new Map<string, BadgeNode>();

    /**节点组 */
    // private _badgeGropu = new Map<string, string[]>();

    /**绑定节点UI */
    private _bindViews = new Map<Laya.Sprite, BadgeView>();

    /**脏节点池 */
    private _tempList = new Set<BadgeNode>();

    /**需要刷新的UI节点 */
    private _tempNeedList = new Set<BadgeNode>();

    /**红点逻辑是否运行中 */
    private _runing: boolean = false;


    private _lastUpdate: number = 0;



    /**开始执行红点逻辑 */
    run(nowRun?: boolean) {
        this._runing = true;
    }

    /**停止红点逻辑 */
    stop() {
        this._runing = false;

        this._tempList.clear();
        this._bindViews.forEach((v, k) => {
            if (!v || !v.view || v.view.destroyed) {
                v?.clear();
                this._bindViews.delete(k);
                return;
            }

            UIUtils.setBadge(v.view, false);
        });

        this._bindViews.clear();
    }



    /**
     * 绑定红点,多次调用就会绑定多个
     * @param type 红点类型
     * @param view 红点UI
     * @param caller 作用范围
     * @param pos 红点位置，相对与view
     * @param refresh 立即刷新
     * @param reverse 是否反转
     * @param size 红点尺寸
     * @returns 
     */
    on(view: Laya.Sprite, type: string, caller?: any, pos?: { x: number, y: number }, refresh: boolean = true, reverse: boolean = false, size?: { x: number, y: number }) {

        this.onAll(view, [type], caller, pos, refresh, reverse, size);
    }

    onAll(view: Laya.Sprite, typeList: string[], caller?: any, pos?: { x: number, y: number }, refresh: boolean = true, reverse: boolean = false, size?: { x: number, y: number }) {

        let item = this._bindViews.get(view);
        if (item && item.view !== view) {
            warn("红点绑定UI不匹配");
            return;
        }

        if (!item) {
            item = BadgeView.create();
            this._bindViews.set(view, item);
        }

        typeList.forEach(v => {
            item.add(v)
            refresh && this.event(v);
        });

        item.view = view;
        item.caller = caller;
        item.badge_pos = pos;
        item.reverse = reverse;
        item.badge_size = size;

        log("bind badge list:", typeList, view?.name);
    }


    /**
     * 解除绑定红点监听
     * @param view 
     * @param type 不传清理view下所有绑定
     * @returns 
     */
    off(view: Laya.Sprite, type?: string) {
        let item = this._bindViews.get(view);
        if (!item) {
            UIUtils.setBadge(view, false);
            return;
        }

        let typeList = type ? [type] : item.array;
        typeList.forEach(v => item.remove(v));
        this.event(...typeList);

        if (item.isEmpty()) {
            item.clear();
            this._bindViews.delete(view);
            UIUtils.setBadge(view, false);
        }

        log("off badge:", type, view?.name);
    }

    /**解除绑定红点监听 */
    offAll(caller: any) {
        this._bindViews.forEach((v, k) => {
            if (v.caller === caller) {  //解除绑定  
                this._bindViews.delete(k);
                v.recover();
            }
        })
    }

    /**刷新红点 */
    event(...keyLst: string[]) {

        if (!this._runing) return;

        for (let k of keyLst) {
            let elm = this.getBadgeNode(k);
            if (!elm) continue;

            this._tempList.add(elm);
        }

        this.updateBadge();
    }


    /**
     * 注册红点
     * @param type 红点标识
     * @param param  
     * @param group 红点属于哪一个组
     * @returns 
     */
    regist(type: string, param: BadgeAction, group?: string | number) {
        let elm = this._badges.get(type);
        if (!elm) {
            elm = new BadgeNode();
            elm.key = type;
            elm.group = group;
            this._badges.set(type, elm);

        } else {
            warn("重复注册红点:", type);
        }

        elm.action = param;
        elm.group = group;
        elm.update();
        return elm;
    }

    /**注销红点 */
    unRegist(type: string) {
        let elms = this._badges;
        elms.has(type) && elms.delete(type);
    }

    unRegistAll() {
        this._badges.clear();
    }


    getBadgeNode(tyep: string) {
        return this._badges.get(tyep);
    }

    /**获取红点状态 */
    getValueByType(...types: string[]): boolean | number {

        let badges = this._badges;
        for (let type of types) {
            let elm = badges.get(type);
            if (elm && elm.flag) {
                return elm.value;
            }
        }

        return false;
    }


    private updateBadge() {
        if (this._lastUpdate > 0) return;
        this._lastUpdate = Date.now();

        Laya.timer.once(1000, this, () => {
            this._lastUpdate = -1;
            this._tempList.forEach(v => {
                if (v.update()) {
                    this._tempNeedList.add(v);
                }
            })
            this._tempList.clear();

            this.updateView();
        })
    }

    private updateView() {

        this._bindViews.forEach((v, k) => {

            if (k?.destroyed || v.isEmpty()) {
                this._bindViews.delete(k);
                v.recover();
                return;
            }

            let value = this.getValueByType(...v.array);

            UIUtils.setBadge(k, value, v.badge_pos, v.reverse, v.badge_size);
        })

        log("badge refresh :", this._bindViews.size);

    }

}

function log(...str: any[]) {
    
}

function warn(...str: any[]) {
    console.warn("[--Badge--]", ...str);
}

export var badge = new BadgeManage();