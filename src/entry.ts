import apk from "./core/apk";
import { GET } from "./core/Context";
import LogMgr, { LogLevel } from "./core/LogMgr";
import { UILayer, UIManager } from "./core/UIManage";
import { UIDefine } from "./patch/UIDefine";

Laya.addBeforeInitCallback((stageConfig) => {
    Laya.Config.isAntialias = true;
    Laya.Config.useWebGL2 = true;
    stageConfig.designWidth = apk.getStageWidth();

    // LogMgr.setOpenLevel(LogLevel.ERROR | LogLevel.NetRequest | LogLevel.NetResponse);
    LogMgr.log("Laya before init", stageConfig);
})

Laya.addAfterInitCallback(() => {
    LogMgr.log("Laya initialized");
})

export function main() {

    LogMgr.log("Laya.Browser.height=" + Laya.Browser.height + ",Laya.Browser.width=" + Laya.Browser.width + ",h/w=" + Laya.Browser.height / Laya.Browser.width);
    GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop });
    GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop, overwrite: true });
}

