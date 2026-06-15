import minimist from "minimist";
import { runIDEbyScript } from "./tools/utils.js";
import path from "node:path";
import { fileURLToPath } from "node:url";


const argv = minimist(process.argv.slice(2), {
    string: ["platform"],
    alias: {
        p: "platform"
    },
    default: {
        platform: "buildWxgame"
    }
});

const { platform } = argv;

const projectPath = path.dirname(fileURLToPath(import.meta.url));


function complete() {
    return import("./tools/utils.js").then(({ runIDEbyScript }) => runIDEbyScript(projectPath, "complete_script", "complete"));
}

function build() {
    // return import("./tools/build.js").then(({ build }) => build(platform));
    return import("./tools/utils.js").then(({ runIDEbyScript }) => runIDEbyScript(projectPath, "build_script", platform));
}

export { complete, build };