import apk from "./core/apk";
import { conf } from "./core/conf";
import { UILayer } from "./core/UIManage";
import { Game } from "./game";

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
    Game.I.UI.CreateUI("view/loading/loading.lh", {
        type: "item",
        layer: UILayer.DialogTop
    });
    // Laya.Scene.open("scene/login/loading.ls");
}

