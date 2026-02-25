Laya.addBeforeInitCallback((stageConfig) => {
    Laya.Config.isAntialias = true;
    Laya.Config.useWebGL2 = true;
    console.log("Laya before init", stageConfig);

})

Laya.addAfterInitCallback(() => {
    console.log("Laya initialized");
})

export function main() {
    console.log("Game start");
    Laya.Scene.open("scene/loading.ls");

}