//UI打开参数
export class UIOption {

    /**携带参数 */
    data: any[];

    /**ui名称 */
    name: string = "";

    /**页面组 */
    group: number = 0;

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

/**UI层级 */
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


export class UIManage extends Laya.EventDispatcher {

    openUI(url: string, option: any) {
                
    }

}