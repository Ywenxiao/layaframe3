import { IAppAdapter } from "./IAppAdapter";

export default class PcApp extends Laya.EventDispatcher implements Partial<IAppAdapter> {
    private static I: PcApp = null;

    static getInst() {
        if (!this.I) {
            this.I = new PcApp();
        }
        return this.I;
    }

    isPad() {
        if (Laya.Browser.onIPad) {
            return 1;
        }
        if (Laya.Browser.height > 0 && Laya.Browser.width > 0) {
            console.log("Laya.Browser.height=" + Laya.Browser.height + ",Laya.Browser.width=" + Laya.Browser.width + ",h/w=" + Laya.Browser.height / Laya.Browser.width);
            if (Laya.Browser.height / Laya.Browser.width < 1.76) {
                return 2;
            }
        }
        return 0;
    }

    // getItem(key: string): string {
    //     throw new Error("Method not implemented.");
    // }
    // setItem(key: string, value: string): void {
    //     throw new Error("Method not implemented.");
    // }
    onShow(callback: (res?: any) => void): void {
        throw new Error("Method not implemented.");
    }
    onHide(callback: (res?: any) => void): void {
        throw new Error("Method not implemented.");
    }
    share(data: any, callback: (res?: any) => void): void {
        throw new Error("Method not implemented.");
    }
    showAd(callback: (res?: any) => void): void {
        throw new Error("Method not implemented.");
    }

    getOpenId() {
        return Promise.resolve({ openId: "pc" });
    }

    getPlatform(): number {
        return 0;
    }
}