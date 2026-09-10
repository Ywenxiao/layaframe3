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
    // 原 loading 入口，恢复时取消下面两行注释
    // GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop });
    // GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop, overwrite: true });

    GET(UIManager).CreateUI(UIDefine.mapDemo, { type: "view", layer: UILayer.View });
}

