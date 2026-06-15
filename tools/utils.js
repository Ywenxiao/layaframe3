
import { exec } from "node:child_process";

function run(cmd, cb) {
    console.log("run ▶ ", cmd);

    return new Promise((resolve, reject) => {
        exec(cmd, { encoding: "utf-8" }, (error, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);

            // 完成回调
            if (typeof cb === "function") {
                cb(error, stdout, stderr);
            }

            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}


export function runIDEbyScript(projectPath, script_name, fun_name) {

    return run(`LayaAirIDE --project=${projectPath} --script=${script_name}.${fun_name}`);
}


