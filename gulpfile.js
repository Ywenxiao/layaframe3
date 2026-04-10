import minimist from "minimist";

const argv = minimist(process.argv.slice(2));
console.log(argv);

const platform = argv.platform || argv.p || "buildWxgame";

export function build() {
    return import("./tools/build.js").then(({ build }) => build(platform));
}