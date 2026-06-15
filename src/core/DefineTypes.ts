/**全局游戏事件 */

export interface IContext {

    /**切换前台调用 */
    onShow?(param?: any): void;

    /**切换后台调用 */
    onHide?(param?: any): void;

    /**激活状态变化 */
    onActive?(active: boolean): void;

    /**退出游戏之前调用一次 */
    onDispose?(): void;
}


/**脚本类型 */
export enum ContextType {

    /**UI界面 */
    // UI = 1,

    /**组件，可以定义一些跨页面使用的方法，生命周期自定义 */
    COMPONENT = 2,

    /**系统，全局存在不会卸载的 */
    SYSTEM = 3,
}