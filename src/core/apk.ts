import APP from "@APP";
import { IAppAdapter } from "../platform/IAppAdapter";
import { conf } from "./conf";

export default class apk {
    private static localData = {};


    static getApp(): IAppAdapter {
        return APP.getInst() as any;
    }

    // 是否为平板设备(屏幕短边 >= 768)
    static isPad() {
        if (this.getApp().isPad) {
            return this.getApp().isPad();
        }

        let check = Math.min(Laya.Browser.width, Laya.Browser.height) >= 768;

        apk.isPad = function () { return check; }

        return check
    }

    // 固定高度 1334 适配:宽屏等比扩展,窄屏保持最小 750
    static getStageWidth() {
        if (!this.isPad()) return 750;

        let w = Math.max(750, Math.round(1334 * Laya.Browser.width / Laya.Browser.height));

        apk.getStageWidth = function () { return w; }

        return w;
    }


    public static getItem(name: string, def: any = null, useuid: boolean = true): string {
        if (useuid) {
            name = `${conf.getUID()}${name}`
        }

        if (apk.localData[name] != undefined) {
            return apk.localData[name];
        }

        var app = apk.getApp();
        if (app != null) {
            if (app.getItem != null) {
                var val: string = app.getItem(name);
                if (val != null && val.length > 0) {
                    apk.localData[name] = val;
                    return val;
                } else {
                    apk.localData[name] = def;
                    return def;
                }
            }
        }
        val = Laya.LocalStorage.getItem(name);
        if (val != null && val.length > 0)
            return val;
        else
            return def;
    }
    public static setItem(name: string, value: string, useuid: boolean = true): void {
        if (useuid) {
            name = `${conf.getUID()}${name}`
        }

        apk.localData[name] = value;
        var app = apk.getApp();
        if (app != null) {
            if (app.setItem != null) {
                return app.setItem(name, value.toString());
            }
        }
        return Laya.LocalStorage.setItem(name, value.toString());
    }
    public static delItem(name: string, useuid: boolean = true): void {

        if (useuid) {
            name = `${conf.getUID()}${name}`
        }

        apk.localData[name] = undefined;
        var app = apk.getApp();
        if (app != null) {
            if (app.removeItem != null) {
                return app.removeItem(name);
            } else {
                return apk.setItem(name, "");
            }
        }
        Laya.LocalStorage.removeItem(name);
    }

    
    public static setJsonItem(name: string, value: object): void {
        var str: string = JSON.stringify(value);
        apk.setItem(name, str);
    }


    public static getJsonItem(name: string): any {
        var data = apk.getItem(name);
        if (typeof (data) != typeof ("str"))
            return null;
        if (data.indexOf("{") < 0)
            return null;
        return JSON.parse(data);
    }



    static resCDN() {
        return "cdn/"
    }

    static resLocal() {
        return "resources/"
    }

    //是否是高性能模式，主要针对ios，开启后会有更激进的内存管理和更频繁的垃圾回收
    static isHightPerformanceMode(): boolean {
        return apk.getApp()?.isIOSHighPerformanceMode?.() === true ? true : false;
    }

    //是否需要激进的内存管理
    static isLowMemory() {
        if (apk.getApp()?.isIOSLowPerformanceMode?.()) {
            return true;
        }

        return false;
    }

    //加速垃圾回收
    static triggerGC() {
        apk.getApp()?.triggerGC?.();
    }

    //是否使用其它货币支付
    static use_other_money() {
        // if (apk.isCydyTt() || apk.isFzdyTt()) {
        //     return apk.getApp().use_dy_diamond?.()
        // }

        // if (apk.isAli()) {
        //     return apk.getApp().use_zhifudou?.();
        // }

        return false;
    }

    //其它货币支付图标
    static get_othre_money_url() {
        // if (apk.isCydyTt() || apk.isFzdyTt()) {
        //     return apk.resCDN() + "tt_assets/img_dy.png"
        // }

        // if (apk.isAli()) {
        //     return apk.resCDN() + "zfb_assets/img_zfb.png"
        // }

        //TODO
        return "no_money_skin"

    }
}