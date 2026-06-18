import apk from "./core/apk";
import { conf } from "./core/conf";
import { GET } from "./core/Context";
import { UILayer, UIManager } from "./core/UIManage";
import { Game } from "./game";
import { UIDefine } from "./patch/UIDefine";

Laya.addBeforeInitCallback((stageConfig) => {
    Laya.Config.isAntialias = true;
    Laya.Config.useWebGL2 = true;
    stageConfig.designWidth = apk.getStageWidth();

    console.log("Laya before init", stageConfig);
})

Laya.addAfterInitCallback(() => {
    console.log("Laya initialized");
})

export function main() {
    console.log("Game start");
    GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop });
}

