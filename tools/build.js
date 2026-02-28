
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
    console.log("run ▶ ", cmd);

    const output = execSync(cmd, {
        stdio: "pipe"   // 捕获输出
    });

    process.stdout.write(output); // 再打印出来

    return output.toString();
}
function build(fun) {
    run(`LayaAirIDE --project=${projectPath} --script=build_script.${fun}`);
}

build("buildWeb");