declare class Xwz_Sdk {
    static AddCmd(name, arrval): any;
    static InitLaya(url): any;
    static callURLLaya(params): any;

    static ClearAll();
    static OpenConsole();
    static getVersion();
    static md5(str): any;
    static ToBase64URI(s): any;
    static FromBase64(s): any;
    static setCallBack(b): any;
    static SetLogFun(f): any;
    static SetConf(c): any;

    /**只支持object */
    static GetProxy(o): any;
    static StartNextCall();
}