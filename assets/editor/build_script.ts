@IEditorEnv.regClass()
class build_script {
    // 构建web
    static async buildWeb() {
        return IEditorEnv.BuildTask.start("web").waitForCompletion();
    }

    // 构建微信小游戏
    static async buildWxgame() {
        return IEditorEnv.BuildTask.start("wxgame").waitForCompletion();
    }

    // 构建抖音小游戏
    static async buildBytedancegame() {
        return IEditorEnv.BuildTask.start("bytedancegame").waitForCompletion();
    }

    // 构建oppo小游戏
    static async buildOppogame() {
        return IEditorEnv.BuildTask.start("oppogame").waitForCompletion();
    }

    // 构建vivo小游戏
    static async buildVivogame() {
        return IEditorEnv.BuildTask.start("vivogame").waitForCompletion();
    }

    // 构建小米快游戏
    static async buildXmgame() {
        return IEditorEnv.BuildTask.start("xmgame").waitForCompletion();
    }

    // 构建支付宝小游戏
    static async buildAlipaygame() {
        return IEditorEnv.BuildTask.start("alipaygame").waitForCompletion();
    }

    // 构建淘宝小游戏
    static async tbgame() {
        return IEditorEnv.BuildTask.start("tbgame").waitForCompletion();
    }
}