# 3D 相机渲染 2D 地图（近大远小）演示 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 layaframe3 项目中用 3D 相机渲染 2D 风格地图，实现角色沿路径行走时的"近大远小"透视效果演示（占位素材，启动直进）。

**Architecture:** Scene2D 视图内嵌 Scene3D（透视相机斜视平躺地面），地面/建筑/角色均为 `internal/Plane.lm` 平面 + Unlit 材质贴图。近大远小由透视投影自动产生，遮挡由深度缓冲自动处理；脚本只负责路径插值运动。所有场景/材质编辑走 IDE MCP。

**Tech Stack:** LayaAir 3.x（ui2 新 UI）、TypeScript、Node v22（`--experimental-strip-types` 跑测试）、Laya IDE MCP（AssetManagement/SceneManagement/Laya_EditAsset/Laya_ValidateLayaAsset/ProjectManagement/DebugManagement）。

**Spec:** `docs/superpowers/specs/2026-09-08-map3d-perspective-demo-design.md`

## Global Constraints

- 引擎类必须用 `Laya.` 前缀访问（`Laya.Sprite`、`Laya.timer` 等）。
- `.ls` / `.lh` / `.lmat` 文件**禁止**用 write/Edit 直接修改，必须走 `Laya_EditAsset`（JSON Patch）；编辑 `.ls/.lh` 后用 `Laya_ValidateLayaAsset` 校验。
- 资源放 `assets/resources/` 下；场景视图放 `assets/view/`。
- JSON 指令键必须带下划线前缀：`_$type`、`_$id`、`_$child`、`_$comp`、`_$var`、`_$runtime`（不要被 MCP 返回数据丢下划线误导）。
- ui2 模式：场景 2D 节点用新 UI（G 前缀），3D 节点不受此限。
- 每次 git 提交只 add 本任务相关文件（工作区存在与本任务无关的既有改动：`.chat/mcp-ui-config.json` 修改、`assets/resources/loading.lh.meta` 删除——**不要**提交它们）。
- 提交信息末尾加 `Co-Authored-By: Claude <noreply@anthropic.com>`。
- 代码风格匹配现有项目：中文注释、`LogMgr.log` 日志、`@regClass()` 装饰器、IView 接口。

---

### Task 1: MapPath3D 路径插值类（TDD）

**Files:**
- Create: `src/view/map/MapPath3D.ts`
- Test: `tests/mapPath3d.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `export interface PathPoint { x: number; z: number; }`
  - `export class MapPath3D`：`constructor(points: PathPoint[], speed: number)`（少于 2 个点或 speed ≤ 0 抛 Error）；`advance(dtSec: number): void`（推进距离，到端点自动折返）；`get position(): PathPoint`（当前地面 (x,z) 位置）。

- [ ] **Step 1: 写失败测试**

创建 `tests/mapPath3d.test.ts`（`tests/` 不在 tsconfig include 内，不会进 IDE 构建）：

```ts
import assert from "node:assert/strict";
import { MapPath3D } from "../src/view/map/MapPath3D.ts";

function test(msg: string, fn: () => void) {
    try {
        fn();
        console.log("PASS", msg);
    } catch (e) {
        console.error("FAIL", msg, e);
        process.exitCode = 1;
    }
}

test("少于2个路径点抛错", () => {
    assert.throws(() => new MapPath3D([{ x: 0, z: 0 }], 100));
});

test("speed<=0抛错", () => {
    assert.throws(() => new MapPath3D([{ x: 0, z: 0 }, { x: 1, z: 0 }], 0));
});

test("初始位置为起点", () => {
    const p = new MapPath3D([{ x: 10, z: -5 }, { x: 20, z: 5 }], 100);
    assert.deepEqual(p.position, { x: 10, z: -5 });
});

test("匀速插值与端点折返", () => {
    const p = new MapPath3D([{ x: 0, z: 0 }, { x: 100, z: 0 }], 50);
    p.advance(1);
    assert.deepEqual(p.position, { x: 50, z: 0 });
    p.advance(1);
    assert.deepEqual(p.position, { x: 100, z: 0 });
    p.advance(1);
    assert.deepEqual(p.position, { x: 50, z: 0 });
    p.advance(1);
    assert.deepEqual(p.position, { x: 0, z: 0 });
});

test("多段路径跨段插值", () => {
    const p = new MapPath3D([{ x: 0, z: 0 }, { x: 100, z: 0 }, { x: 100, z: 100 }], 150);
    p.advance(1); // 走 150: 第1段100走完, 第2段走50
    assert.deepEqual(p.position, { x: 100, z: 50 });
});

test("零长段跳过", () => {
    const p = new MapPath3D([{ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 50, z: 0 }], 10);
    p.advance(1);
    assert.deepEqual(p.position, { x: 10, z: 0 });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --experimental-strip-types tests/mapPath3d.test.ts`
Expected: 全部 FAIL，报 `Cannot find module '../src/view/map/MapPath3D.ts'`（无此文件）。运行时会有 strip-types 实验警告，属正常。

- [ ] **Step 3: 写最小实现**

创建 `src/view/map/MapPath3D.ts`：

```ts
/** 地面路径点(世界坐标 x, z) */
export interface PathPoint {
    x: number;
    z: number;
}

/** 3D 折线路径: 匀速推进 + 端点自动折返。纯逻辑, 无引擎依赖。 */
export class MapPath3D {
    private readonly _points: PathPoint[];
    private readonly _segLens: number[] = [];
    private readonly _total: number;
    private _dist = 0;
    private _dir: 1 | -1 = 1;

    /** 移动速度(单位/秒) */
    readonly speed: number;

    constructor(points: PathPoint[], speed: number) {
        if (!points || points.length < 2) {
            throw new Error("MapPath3D: 路径点至少需要 2 个");
        }
        if (!(speed > 0)) {
            throw new Error("MapPath3D: speed 必须大于 0");
        }
        this._points = points;
        this.speed = speed;

        let total = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].x - points[i].x;
            const dz = points[i + 1].z - points[i].z;
            const len = Math.sqrt(dx * dx + dz * dz);
            this._segLens.push(len);
            total += len;
        }
        this._total = total;
    }

    /** 按秒推进, 到端点自动折返 */
    advance(dtSec: number): void {
        if (this._total <= 0) return;
        this._dist += this._dir * this.speed * dtSec;
        if (this._dist >= this._total) {
            this._dist = this._total - (this._dist - this._total);
            this._dir = -1;
        } else if (this._dist <= 0) {
            this._dist = -this._dist;
            this._dir = 1;
        }
    }

    /** 当前 (x, z) 地面位置 */
    get position(): PathPoint {
        if (this._total <= 0) return this._points[0];
        let d = this._dist;
        for (let i = 0; i < this._segLens.length; i++) {
            if (d <= this._segLens[i]) {
                const a = this._points[i];
                const b = this._points[i + 1];
                const t = this._segLens[i] > 0 ? d / this._segLens[i] : 0;
                return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
            }
            d -= this._segLens[i];
        }
        return this._points[this._points.length - 1];
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --experimental-strip-types tests/mapPath3d.test.ts`
Expected: 6 条全 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/view/map/MapPath3D.ts tests/mapPath3d.test.ts
git commit -m "feat: 新增 MapPath3D 3D折线路径插值类(含测试)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 占位 PNG 生成

**Files:**
- Create: `tools/genMapPlaceholders.mjs`
- Generate: `assets/resources/map/map_ground.png`、`map_building.png`、`map_role.png`

**Interfaces:**
- Consumes: 无
- Produces: 3 张占位 PNG（Task 3 的材质引用其 IDE 导入后生成的 UUID）

- [ ] **Step 1: 写生成脚本**

创建 `tools/genMapPlaceholders.mjs`：

```js
// 一次性脚本: 生成地图演示占位 PNG(纯 RGBA 直绘, 无外部依赖)
import { deflateSync } from "node:zlib";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "resources", "map");

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
}

function encodePng(w, h, rgba) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) {
        raw[y * (w * 4 + 1)] = 0; // filter: none
        rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

// ---------- 简易画布 ----------
function makeCanvas(w, h) {
    return { w, h, data: Buffer.alloc(w * h * 4) };
}

function setPx(c, x, y, r, g, b, a = 255) {
    if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
    const i = (y * c.w + x) * 4;
    c.data[i] = r;
    c.data[i + 1] = g;
    c.data[i + 2] = b;
    c.data[i + 3] = a;
}

function fillRect(c, x0, y0, x1, y1, r, g, b, a = 255) {
    for (let y = Math.max(0, y0); y < Math.min(c.h, y1); y++)
        for (let x = Math.max(0, x0); x < Math.min(c.w, x1); x++)
            setPx(c, x, y, r, g, b, a);
}

function fillEllipse(c, cx, cy, rx, ry, r, g, b, a = 255) {
    for (let y = cy - ry; y <= cy + ry; y++)
        for (let x = cx - rx; x <= cx + rx; x++) {
            const nx = (x - cx) / rx;
            const ny = (y - cy) / ry;
            if (nx * nx + ny * ny <= 1) setPx(c, x, y, r, g, b, a);
        }
}

// ---------- 各占位图 ----------
function drawGround() {
    const c = makeCanvas(512, 512);
    fillRect(c, 0, 0, 512, 512, 102, 153, 85); // 草地底
    for (let i = 0; i <= 512; i += 32) { // 网格线
        fillRect(c, i, 0, i + 2, 512, 86, 130, 72);
        fillRect(c, 0, i, 512, i + 2, 86, 130, 72);
    }
    fillRect(c, 224, 0, 288, 512, 188, 172, 138); // 中央道路带
    for (let y = 16; y < 512; y += 64) // 道路虚线
        fillRect(c, 254, y, 258, y + 32, 240, 240, 230);
    return c;
}

function drawBuilding() {
    const c = makeCanvas(300, 360);
    fillRect(c, 0, 0, 300, 360, 168, 120, 90); // 墙
    fillRect(c, 0, 0, 300, 44, 120, 82, 60); // 屋顶
    fillRect(c, 60, 220, 180, 360, 90, 60, 40); // 门
    fillRect(c, 30, 80, 100, 150, 70, 90, 110); // 左窗
    fillRect(c, 200, 80, 270, 150, 70, 90, 110); // 右窗
    return c;
}

function drawRole() {
    const c = makeCanvas(100, 180); // 透明底
    fillEllipse(c, 50, 110, 30, 55, 210, 70, 70); // 身体
    fillEllipse(c, 50, 35, 28, 28, 240, 200, 160); // 头
    fillRect(c, 20, 150, 44, 175, 60, 50, 50); // 左腿
    fillRect(c, 56, 150, 80, 175, 60, 50, 50); // 右腿
    return c;
}

// ---------- 写入并校验 ----------
function writeAndVerify(name, c) {
    const buf = encodePng(c.w, c.h, c.data);
    const file = join(OUT_DIR, name);
    writeFileSync(file, buf);
    const back = readFileSync(file);
    const sigOk = back.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const w = back.readUInt32BE(16);
    const h = back.readUInt32BE(20);
    if (!sigOk || w !== c.w || h !== c.h) {
        throw new Error(`PNG 校验失败: ${name}`);
    }
    console.log(`OK ${file} ${w}x${h} ${buf.length} bytes`);
}

mkdirSync(OUT_DIR, { recursive: true });
writeAndVerify("map_ground.png", drawGround());
writeAndVerify("map_building.png", drawBuilding());
writeAndVerify("map_role.png", drawRole());
```

- [ ] **Step 2: 运行生成并校验**

Run: `node tools/genMapPlaceholders.mjs`
Expected: 输出 3 行 `OK ...png`（512×512 / 300×360 / 100×180）。

- [ ] **Step 3: 等待 IDE 导入生成 meta**

调用 MCP `AssetManagement` action `waitAssetBusy`。
然后 `ls assets/resources/map/` 确认 3 个 `.png.meta` 已生成。

- [ ] **Step 4: 提交**

```bash
git add tools/genMapPlaceholders.mjs assets/resources/map/
git commit -m "feat: 新增地图演示占位PNG生成脚本及素材

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 创建 3 个 Unlit 材质

**Files:**
- Create (MCP): `assets/resources/map/mat_ground.lmat`、`mat_building.lmat`、`mat_role.lmat`
- Modify (MCP): 同上（补纹理引用/渲染状态）

**Interfaces:**
- Consumes: Task 2 的 PNG 导入后 UUID
- Produces: 3 个材质 UUID（Task 5 的 MeshRenderer 引用）

- [ ] **Step 1: 取 PNG 的 UUID**

调用 MCP `AssetManagement` action `pathToUuid`，对 `assets/resources/map/map_ground.png`、`map_building.png`、`map_role.png` 各取一次。记录 3 个 UUID（记为 PNG_GROUND、PNG_BUILDING、PNG_ROLE）。

- [ ] **Step 2: 创建 3 个材质**

调用 MCP `AssetManagement` action `createMaterial`，共 3 次：
- `{ name: "mat_ground", savePath: "assets/resources/map", materialType: "Unlit" }`
- `{ name: "mat_building", savePath: "assets/resources/map", materialType: "Unlit" }`
- `{ name: "mat_role", savePath: "assets/resources/map", materialType: "Unlit" }`

然后 `waitAssetBusy`；`ls assets/resources/map/` 确认 3 个 `.lmat`（和 `.lmat.meta`）存在。

- [ ] **Step 3: 读取生成的 lmat 确认结构**

`cat assets/resources/map/mat_ground.lmat` 查看实际结构。预期两种格式之一：
- 02 格式：`{"version": "LAYAMATERIAL:02", "props": {..., "textures": [], "vectors": [...], "renderStates": [...]}}`
- 04 格式：`{"version": "LAYAMATERIAL:04", "props": {...扁平字段如 "u_AlbedoTexture"...}}`

- [ ] **Step 4: 用 Laya_EditAsset 补纹理与渲染状态**

`Laya_EditAsset` 的 op value 必须传 **JSON 字面量字符串**。

**mat_ground.lmat**：
- 若为 02 格式（textures 是数组）：
  - op: `{"op": "add", "path": "/props/textures/0", "value": "{\"path\":\"res://PNG_GROUND\",\"name\":\"u_AlbedoTexture\"}"}`
  - （若已存在空 textures 元素则用 `replace` 替换 `.../textures/0/path` 为 `"res://PNG_GROUND"`）
- 若为 04 格式（扁平字段）：
  - op: `{"op": "add", "path": "/props/u_AlbedoTexture", "value": "{\"path\":\"res://PNG_GROUND\",\"name\":\"u_AlbedoTexture\"}"}`

**mat_building.lmat**：同上，UUID 用 PNG_BUILDING。

**mat_role.lmat**：纹理同 mat_ground 的操作（UUID 用 PNG_ROLE），另外：
- 02 格式：op replace `/props/renderStates/0` → `"{\"cull\":2,\"blend\":1,\"srcBlend\":770,\"dstBlend\":771,\"depthWrite\":false,\"depthTest\":515}"`；op replace `/props/renderQueue` → `"3000"`（若字段不存在则 add）
- 04 格式：op replace `/props/s_Blend` → `"1"`、`/props/s_SrcBlend` → `"770"`（或对应字段名，以实际文件为准）、`/props/s_DepthWrite` → `"false"`、`/props/renderQueue` → `"3000"`（字段名以实际文件为准）

- [ ] **Step 5: 校验与提交**

对 3 个 lmat 各调一次 `Laya_ValidateLayaAsset`，全部通过后：

```bash
git add assets/resources/map/mat_ground.lmat assets/resources/map/mat_ground.lmat.meta assets/resources/map/mat_building.lmat assets/resources/map/mat_building.lmat.meta assets/resources/map/mat_role.lmat assets/resources/map/mat_role.lmat.meta
git commit -m "feat: 新增地图演示3个Unlit材质(地面/建筑/角色)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: mapDemo 视图脚本与基类

**Files:**
- Create: `src/view/map/mapDemo.ts`
- Create: `src/view/map/mapDemo.generated.ts`

**Interfaces:**
- Consumes: Task 1 的 `MapPath3D`、`PathPoint`
- Produces:
  - `mapDemoBase extends Laya.Scene`，公开字段：`scene3d: Laya.Scene3D`、`camera: Laya.Camera`、`ground: Laya.Sprite3D`、`building: Laya.Sprite3D`、`role: Laya.Sprite3D`
  - `mapDemo extends mapDemoBase implements IView`（`@regClass()`）
  - 脚本资源 UUID（Task 5 的 `_$runtime` 引用）

- [ ] **Step 1: 写视图基类**

创建 `src/view/map/mapDemo.generated.ts`（仿 IDE 生成格式，字段名与 Task 5 场景节点的 `name` + `_$var` 一致）：

```ts
/**This class is automatically generated by LayaAirIDE, please do not make any modifications. */


/**
 * view/map/mapDemo.ls
 */
export class mapDemoBase extends Laya.Scene {
    public scene3d!: Laya.Scene3D;
    public camera!: Laya.Camera;
    public ground!: Laya.Sprite3D;
    public building!: Laya.Sprite3D;
    public role!: Laya.Sprite3D;
}
```

- [ ] **Step 2: 写视图脚本**

创建 `src/view/map/mapDemo.ts`：

```ts
const { regClass } = Laya;
import LogMgr from "../../core/LogMgr";
import { IView } from "../../core/UIManage";
import { mapDemoBase } from "./mapDemo.generated";
import { MapPath3D, PathPoint } from "./MapPath3D";

/** 演示路径点(地面世界坐标): 从远(-z)到近(+z) */
const DEMO_PATH: PathPoint[] = [
    { x: 0, z: -1200 },
    { x: 400, z: -600 },
    { x: -300, z: 0 },
    { x: 300, z: 600 },
    { x: 0, z: 1100 },
];

/** 移动速度(单位/秒) */
const DEMO_SPEED = 600;

@regClass()
export class mapDemo extends mapDemoBase implements IView {

    private _path: MapPath3D;
    private _tmpPos: Laya.Vector3 = new Laya.Vector3();

    onInit(): void {
        LogMgr.log("mapDemo onInit");
        this._path = new MapPath3D(DEMO_PATH, DEMO_SPEED);
        Laya.timer.frameLoop(1, this, this.onFrame);
    }

    onShow(...args: any[]): void {
        LogMgr.log("mapDemo onShow");
    }

    private onFrame(): void {
        if (!this._path) return;
        this._path.advance(Laya.timer.delta / 1000);
        const p = this._path.position;
        // y 保持场景中设置的地面站立高度, 只更新 x/z
        this._tmpPos.setValue(p.x, this.role.transform.localPosition.y, p.z);
        this.role.transform.position = this._tmpPos;
    }
}
```

- [ ] **Step 3: 等待 IDE 注册脚本并取 UUID**

调用 MCP `AssetManagement` action `waitAssetBusy`，然后：

```bash
cat src/view/map/mapDemo.ts.meta
```

记录其中的 `uuid`（记为 SCRIPT_UUID）。交叉确认：调用 MCP `SceneManagement` action `listComponents`，应能看到 mapDemo 已注册（可选，meta 为准）。

- [ ] **Step 4: 提交**

```bash
git add src/view/map/mapDemo.ts src/view/map/mapDemo.ts.meta src/view/map/mapDemo.generated.ts
git commit -m "feat: 新增 mapDemo 视图脚本(3D相机地图近大远小演示)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 创建 mapDemo.ls 场景

**Files:**
- Create (MCP): `assets/view/map/mapDemo.ls`

**Interfaces:**
- Consumes: Task 3 的 3 个材质 UUID、Task 4 的 SCRIPT_UUID
- Produces: 可被 UIManager 打开的视图场景（Task 6 引用）

场景数值（设计已定）：
- 相机：`localPosition (0, 800, 1600)`，`localRotationEuler x: -26.6`（俯视地面中心），`orthographic: false`、`fieldOfView: 65`、`nearPlane: 0.3`、`farPlane: 5000`
- 地面：`localPosition (0, 0, -250)`，`localScale (2000, 1, 3100)`（覆盖 z∈[-1800, 1300]）
- 建筑：`localPosition (50, 180, -300)`（y=180 为半高，站在地面上），`localRotationEuler x: 90`（Plane.lm 默认法线 +Y，转 90° 后面向 +Z 的相机），`localScale (300, 360, 1)`
- 角色：`localPosition (0, 90, -1200)`（路径起点），`localRotationEuler x: 90`，`localScale (100, 180, 1)`

- [ ] **Step 1: 创建场景文件**

调用 MCP `AssetManagement` action `create`，参数 `{ template: "Scene", path: "assets/view/map", name: "mapDemo" }`。
然后 `waitAssetBusy`；`ls assets/view/map/` 确认 `mapDemo.ls` 存在。

- [ ] **Step 2: 绑定视图脚本**

用 `Laya_EditAsset` 编辑 `assets/view/map/mapDemo.ls`：
- op: `{"op": "add", "path": "/_$runtime", "value": "res://SCRIPT_UUID"}`

- [ ] **Step 3: 添加 Scene3D 节点（根第一个子节点）**

op: `{"op": "add", "path": "/_$child/0", "value": "{\"_$id\":\"mapscene3d1\",\"_$var\":true,\"_$type\":\"Scene3D\",\"name\":\"scene3d\",\"ambientMode\":0,\"_$child\":[]}"}`

- [ ] **Step 4: 添加相机节点**

op: `{"op": "add", "path": "/_$child/0/_$child/0", "value": "{\"_$id\":\"mapcamera1\",\"_$var\":true,\"_$type\":\"Camera\",\"name\":\"camera\",\"transform\":{\"localPosition\":{\"_$type\":\"Vector3\",\"x\":0,\"y\":800,\"z\":1600},\"localRotationEuler\":{\"_$type\":\"Vector3\",\"x\":-26.6,\"y\":0,\"z\":0}},\"clearFlag\":1,\"clearColor\":{\"_$type\":\"Color\",\"r\":0.62,\"g\":0.79,\"b\":0.94},\"orthographic\":false,\"fieldOfView\":65,\"nearPlane\":0.3,\"farPlane\":5000,\"normalizedViewport\":{\"_$type\":\"Viewport\",\"x\":0,\"y\":0,\"width\":1,\"height\":1}}"}`

- [ ] **Step 5: 添加方向光节点**（照抄 IDE 模板的 DirectionLightCom 完整字段）

op: `{"op": "add", "path": "/_$child/0/_$child/1", "value": "{\"_$id\":\"maplight001\",\"_$type\":\"Sprite3D\",\"name\":\"Direction Light\",\"transform\":{\"localPosition\":{\"_$type\":\"Vector3\",\"x\":5,\"y\":10,\"z\":5},\"localRotationEuler\":{\"_$type\":\"Vector3\",\"x\":-50,\"y\":30,\"z\":0}},\"_$comp\":[{\"_$type\":\"DirectionLightCom\",\"color\":{\"_$type\":\"Color\",\"r\":1,\"g\":1,\"b\":1},\"intensity\":1,\"lightmapBakedType\":1,\"shadowMode\":0,\"shadowStrength\":1,\"shadowDistance\":50,\"shadowDepthBias\":1,\"shadowNormalBias\":1,\"shadowNearPlane\":0.1,\"shadowCascadesMode\":0}]}"}`

- [ ] **Step 6: 添加地面节点**（MAT_GROUND 为 Task 3 材质 UUID）

op: `{"op": "add", "path": "/_$child/0/_$child/2", "value": "{\"_$id\":\"mapground1\",\"_$var\":true,\"_$type\":\"Sprite3D\",\"name\":\"ground\",\"transform\":{\"localPosition\":{\"_$type\":\"Vector3\",\"x\":0,\"y\":0,\"z\":-250},\"localScale\":{\"_$type\":\"Vector3\",\"x\":2000,\"y\":1,\"z\":3100}},\"_$comp\":[{\"_$type\":\"MeshFilter\",\"sharedMesh\":{\"_$uuid\":\"internal/Plane.lm\",\"_$type\":\"Mesh\"}},{\"_$type\":\"MeshRenderer\",\"receiveShadow\":false,\"sharedMaterials\":[{\"_$uuid\":\"MAT_GROUND\",\"_$type\":\"Material\"}]}]}"}`

- [ ] **Step 7: 添加建筑节点**（MAT_BUILDING）

op: `{"op": "add", "path": "/_$child/0/_$child/3", "value": "{\"_$id\":\"mapbuild01\",\"_$var\":true,\"_$type\":\"Sprite3D\",\"name\":\"building\",\"transform\":{\"localPosition\":{\"_$type\":\"Vector3\",\"x\":50,\"y\":180,\"z\":-300},\"localRotationEuler\":{\"_$type\":\"Vector3\",\"x\":90,\"y\":0,\"z\":0},\"localScale\":{\"_$type\":\"Vector3\",\"x\":300,\"y\":360,\"z\":1}},\"_$comp\":[{\"_$type\":\"MeshFilter\",\"sharedMesh\":{\"_$uuid\":\"internal/Plane.lm\",\"_$type\":\"Mesh\"}},{\"_$type\":\"MeshRenderer\",\"receiveShadow\":false,\"sharedMaterials\":[{\"_$uuid\":\"MAT_BUILDING\",\"_$type\":\"Material\"}]}]}"}`

- [ ] **Step 8: 添加角色节点**（MAT_ROLE）

op: `{"op": "add", "path": "/_$child/0/_$child/4", "value": "{\"_$id\":\"maprole001\",\"_$var\":true,\"_$type\":\"Sprite3D\",\"name\":\"role\",\"transform\":{\"localPosition\":{\"_$type\":\"Vector3\",\"x\":0,\"y\":90,\"z\":-1200},\"localRotationEuler\":{\"_$type\":\"Vector3\",\"x\":90,\"y\":0,\"z\":0},\"localScale\":{\"_$type\":\"Vector3\",\"x\":100,\"y\":180,\"z\":1}},\"_$comp\":[{\"_$type\":\"MeshFilter\",\"sharedMesh\":{\"_$uuid\":\"internal/Plane.lm\",\"_$type\":\"Mesh\"}},{\"_$type\":\"MeshRenderer\",\"receiveShadow\":false,\"sharedMaterials\":[{\"_$uuid\":\"MAT_ROLE\",\"_$type\":\"Material\"}]}]}"}`

- [ ] **Step 9: 校验场景**

调用 `Laya_ValidateLayaAsset`（`assets/view/map/mapDemo.ls`）。若报错，根据错误信息修正对应字段（常见：字段名带不带 `_$` 前缀、数值类型字符串 vs 数字），重新校验直到通过。
再用 `Laya_ReadLayaAsset`（mode overview）确认节点树：Scene2D → Scene3D → 5 个子节点。

- [ ] **Step 10: 提交**

```bash
git add assets/view/map/mapDemo.ls assets/view/map/mapDemo.ls.meta
git commit -m "feat: 新增 mapDemo.ls 场景(Scene3D+透视相机+地面/建筑/角色平面)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 注册视图并改入口

**Files:**
- Modify: `src/patch/UIDefine.ts`（home 行后加一行）
- Modify: `src/entry.ts`（main 内两行 loading 替换）

**Interfaces:**
- Consumes: Task 5 的场景路径 `view/map/mapDemo.ls`
- Produces: 启动流程直进演示

- [ ] **Step 1: UIDefine.ts 增加条目**

在 `src/patch/UIDefine.ts` 中：

```ts
export class UIDefine {
    static readonly loading = "view/loading/loading.lh";
    static readonly home = "view/home/home.ls";
    static readonly mapDemo = "view/map/mapDemo.ls";
}
```

（即：在 `home` 行后新增 `static readonly mapDemo = "view/map/mapDemo.ls";`）

- [ ] **Step 2: entry.ts 改入口**

`src/entry.ts` 的 `main()` 中，把两行 `CreateUI(UIDefine.loading, ...)` 替换为（原代码注释保留）：

```ts
    // 地图近大远小演示(3D相机) — 验证完成后可恢复 loading 流程
    GET(UIManager).CreateUI(UIDefine.mapDemo, { type: "view", layer: UILayer.View });
    // GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop });
    // GET(UIManager).CreateUI(UIDefine.loading, { type: "view", layer: UILayer.DialogTop, overwrite: true });
```

- [ ] **Step 3: 提交**

```bash
git add src/patch/UIDefine.ts src/entry.ts
git commit -m "feat: 注册 mapDemo 视图, 启动直进3D相机地图演示

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: 运行验证

**Files:** 无（仅验证；如需修复则在对应任务文件上改并补提交）

- [ ] **Step 1: 运行预览**

调用 MCP `ProjectManagement` action `play`（默认参数：editor 内播放当前场景，timeout 10000）。

- [ ] **Step 2: 检查日志**

调用 MCP `DebugManagement` action `startListeningLogs`，等待几秒后 `getLogCache`。预期包含：
- `[UI] open ui view/map/mapDemo.ls`
- `mapDemo onInit`
- `mapDemo onShow`
- 无 error 级别日志（`LogMgr.error` / 红色错误）

- [ ] **Step 3: 视觉核对清单**（在 IDE 预览窗口人工确认）

1. 斜视角地面可见，绿色网格 + 中央道路带，网格随距离变小（透视正确）
2. 角色在路径上往返，远端明显变小、近端明显变大，过渡连续
3. 角色经过建筑（z=-300 附近）时：在建筑远处一侧被遮住、近处一侧遮住建筑
4. 角色贴图直立朝屏幕、正立（无倒置/镜像）；建筑贴图正立

- [ ] **Step 4: 异常修正预案**

| 现象 | 修正 |
|---|---|
| 相机朝天看/只能看到天空色 | camera `localRotationEuler.x` 取反（-26.6 → 26.6），改后重新校验并 play |
| 角色/建筑贴图上下颠倒 | 对应节点 `localRotationEuler.z` 加 180（或 `y` 加 180） |
| 角色/建筑平面看不见（背面剔除） | 对应节点 `localRotationEuler.y` 加 180（翻面朝向相机） |
| 角色穿过建筑时透明排序异常 | mat_role 的 `renderStates` blend/srcBlend/dstBlend 对照 d.ts 常量值复核 |
| 场景校验报字段错误 | 按 `Laya_ValidateLayaAsset` 报错修正字段后重验 |

修正后：`waitAssetBusy` → 重新 play 验证 → 提交修正（`git add <改动的文件>` + 描述性中文提交信息 + Co-Authored-By 尾注）。

- [ ] **Step 5: 停止播放并收尾**

调用 MCP `ProjectManagement` action `stop`。
最终向用户报告：实现内容、如何查看演示（IDE play）、如何切回 loading 流程（entry.ts 注释）、预留的真实素材替换方式（替换 3 张 PNG 与场景参数）。

---

## Self-Review

- **Spec 覆盖**：§5 场景结构→Task 5；§6 脚本→Task 1/4/6；§7 素材→Task 2/3；§8 数据流→Task 4 onFrame + Task 6 入口；§9 验证→Task 7；§10 风险→Task 3（两种 lmat 格式）、Task 5 Step 9（校验迭代）、Task 7 Step 4（视觉异常预案）；§11 YAGNI 未做项→无对应任务 ✓
- **占位符检查**：无 TBD/TODO；所有代码块完整；MCP op 值均为具体 JSON ✓
- **类型一致性**：`MapPath3D(position/advance/speed)` 与 Task 4 用法一致；`mapDemoBase` 字段名（scene3d/camera/ground/building/role）与 Task 5 节点 name/_$var 一致；材质 UUID 占位符 PNG_GROUND/MAT_GROUND 等在各任务间传递一致 ✓
