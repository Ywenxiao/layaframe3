export enum LogLevel {
    LOG = 1,
    NetRequest = 1 << 2,
    NetResponse = 1 << 3,
    ERROR = 1 << 4,

    ALL = LOG | NetRequest | NetResponse | ERROR
}

export default class LogMgr {
    private static openLevel: number = LogLevel.ALL;

    static setOpenLevel(level: number) {
        this.openLevel = level || 0;
    }

    static isOpen(level: LogLevel) {
        return (this.openLevel & level) === level;
    }


    static log(...str: any[]) {

        this.debug(LogLevel.LOG, "green", ...str);
    }

    static error(...str: any[]) {

        this.debug(LogLevel.ERROR, "red", ...str);
    }

    static request(...str: any[]) {
        this.debug(LogLevel.NetRequest, "#007eaf", ...str);
    }

    static response(...str: any[]) {
        this.debug(LogLevel.NetResponse, "#ffb300", ...str);
    }


    static debug(level: LogLevel, color: string, ...str: any[]) {
        if (!this.isOpen(level)) return;

        const isBrowser = Laya.Browser.onChrome || Laya.Browser.onEdge || Laya.Browser.onFirefox;


        if (!isBrowser || Laya.LayaEnv.isEditor) {
            console.log(this.getTime() + " " + this.getLevelName(level), ...str);
            return;
        }

        console.log("%c" + this.getTime() + " " + this.getLevelName(level), this.getColor(color), ...str);
    }


    private static getLevelName(level: LogLevel) {
        switch (level) {
            case LogLevel.LOG:
                return "[LOG]";
            case LogLevel.NetRequest:
                return "[NetRequest]";
            case LogLevel.NetResponse:
                return "[NetResponse]";
            case LogLevel.ERROR:
                return "[ERROR]";
        }
    }

    private static getTime() {
        let date = new Date();
        return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`;
    }

    private static getColor(color: string) {
        return `background-color:${color}; color: white; font-weight: bold; padding: 2px 4px; border-radius: 4px;`;

    }


}