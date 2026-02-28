
/**脚本类型 */
export enum ContextType {

    /**UI界面 */
    UI = 1,

    /**组件，可以定义一些跨页面使用的方法，生命周期自定义 */
    COMPONENT = 2,

    /**系统，全局存在不会卸载的 */
    SYSTEM = 3,
}