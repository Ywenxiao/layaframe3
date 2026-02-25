@IEditorEnv.regClass()
class MyScript {
    static async buildWeb() {
        return IEditorEnv.BuildTask.start("web").waitForCompletion();
    }
}