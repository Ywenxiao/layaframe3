
@IEditorEnv.regClass()
class complete_script {
    // 编译脚本 - 对应 IDE 菜单"重新编译脚本"(compileScripts)
    static async complete() {
        // 输出目录：编译后的 JS 文件存放路径
        const outDir = EditorEnv.projectPath + "/bin/js/bundles";

        // 资源过滤器：决定哪些资源需要包含在编译中
        const outputAssets = {
            has(_asset: IEditorEnv.IAssetInfo): boolean {
                return true; // 包含所有资源
            }
        };

        // Editor.getMenuById("compileScripts").onClickItem("compileScripts")

        // 编译选项
        const options: IEditorEnv.ICodeBuildOptions = {
            minify: false,           // 不压缩（开发模式）
            sourcemap: true,         // 生成 source map
            sourcesContent: true,    // 包含源码内容
        };

        try {
            const files = await EditorEnv.codeBuilder.buildRelease(outDir, outputAssets, options);
            console.log("compileScripts 完成，输出文件:", files);
        } catch (e) {
            console.error("compileScripts 失败:", e);
            throw e;
        }
    }
}