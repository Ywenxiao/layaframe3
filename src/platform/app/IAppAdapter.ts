export interface IAppAdapter {

    getItem?(key: string): string;

    setItem?(key: string, value: string): void;

    onShow?(callback: (res?: any) => void): void;

    onHide?(callback: (res?: any) => void): void;

    /**分享 */
    share?(data: any, callback: (res?: any) => void): void;

    /**看广告 */
    showAd?(callback: (res?: any) => void): void;
}