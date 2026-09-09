# 3D 相机渲染 2D 地图切片 — 设计文档

- 日期：2026-09-09
- 状态：已确认
- 范围：效果验证演示（仅地图，不含建筑/角色/寻路）
- 前置设计：[[2026-09-08-map3d-perspective-demo-design.md]]（本次在其基础上改为真实地图切片并收窄范围）

## 1. 目标

在 layaframe3（LayaAir 3.x、ui2 模式）中用 **3D 透视相机渲染 2D 地图切片**，实现“纯俯视带轻微透视”效果：

- 使用 `assets/cdn/map` 下的 72 张真实地块图
- 地块按 8 列 × 9 行、从下往上从左往右排列
- 每个地块在 3D 世界中占 512×512 单位
- 相机高角度俯视，产生轻微近大远小透视
- 启动直进演示，无额外交互

## 2. 需求澄清结论

| 问题 | 结论 |
|---|---|
| 实现范围 | 仅做 8×9 地图的 3D 透视渲染，本次不含建筑、角色、路径、寻路 |
| 切片像素 | 实际为 250×250，但按 512×512 世界单位摆放（拉伸/放大） |
| 切片布局 | 8 列（x 轴）× 9 行（z 轴），编号 1~72 从底行到顶行、每行从左到右 |
| 相机 | 纯俯视带轻微透视，非 45° 斜视角 |
| 入口 | 启动直进 `mapDemo`；原 loading 代码注释保留 |

### 2.1 编号与坐标映射

行 `r`（0 起始，从底到顶），列 `c`（0 起始，从左到右）：

```
fileIndex = r * 8 + c + 1        // 1 .. 72
x = (c - 3.5) * 512              // 列中心，使地图整体以世界原点为中心
z = (r - 4) * 512                // 行中心，使地图整体以世界原点为中心
```

地图整体世界尺寸：4096（宽）× 4608（深）。

## 3. 方案选择

沿用 09-08 文档选定的 **Scene3D + 透视相机 + Unlit 材质平面** 方案，并细化为：

- 每个地块独立为一个 `Sprite3D` + `MeshFilter(internal/Plane.lm)` + `MeshRenderer`
- 地块按需加载贴图，各自设置 `albedoTexture`
- 相机高角度俯视，轻微透视由投影自动产生

未选择合图方案：9 行 × 512 = 4608，容易超过常见最大纹理尺寸 4096，且 72 个 Plane 对演示无性能压力。

## 4. 场景结构（`assets/view/map/mapDemo.ls`）

```
Scene2D（根，_$runtime: res://<mapDemo.ts uuid>）
└── Scene3D（第一个子节点）
    ├── Main Camera    Camera：透视（orthographic=false）
    │                  localPosition (0, 2500, 50)
    │                  看向 (0, 0, 0)（地面中心）
    │                  fov 60、nearPlane 0.3、farPlane 5000
    │                  clearColor 天蓝色
    ├── DirectionLight Sprite3D + DirectionLightCom（3D 管线光照保底）
    └── Ground         Sprite3D（空父节点，仅用于组织）
        ├── tile_01    Plane(512×512)  tex: assets/cdn/map/1.png
        ├── tile_02    Plane(512×512)  tex: assets/cdn/map/2.png
        ...
        └── tile_72    Plane(512×512)  tex: assets/cdn/map/72.png
```

每个 `tile_XX` 的本地坐标按第 2.1 节公式摆放；Plane 初始为竖直平面，需绕 X 轴旋转 `-90°` 使其平躺于 XZ 平面。

### 4.1 相机参数

| 参数 | 值 | 说明 |
|---|---|---|
| `orthographic` | `false` | 透视投影 |
| `fieldOfView` | 60 | 默认透视张角 |
| `nearPlane` | 0.3 | 近平面 |
| `farPlane` | 5000 | 保证整个地图在裁剪范围内 |
| `localPosition` | `(0, 2500, 50)` | 高角度俯视，y 轴高度提供轻微透视 |
| `lookAt` | `(0, 0, 0)` | 看向地图中心 |

相机高度与 z 偏移可在实现时按视觉微调，目标是“几乎俯视，边缘有轻微缩小”。

## 5. 脚本设计

| 文件 | 职责 |
|---|---|
| `src/view/map/mapDemo.ts` | 视图脚本（`@regClass()` + 实现 `IView`）。`onInit` 中获取 `Ground` 节点，调用 `MapGrid3D.build()` 生成地块并挂到 `Ground` 下 |
| `src/view/map/mapDemo.generated.ts` | 手写 IDE 风格基类（`extends Laya.Scene`），声明 `scene3D` / `ground` 等 `_$var` 字段 |
| `src/view/map/MapGrid3D.ts` | 纯逻辑类：给定列数、行数、地块尺寸，生成地块坐标与文件名；负责创建 `Sprite3D` + `MeshFilter` + `MeshRenderer` 并加载贴图 |
| `src/patch/UIDefine.ts` | 增加 `mapDemo = "view/map/mapDemo.ls"` |
| `src/entry.ts` | `main()` 改为 `CreateUI(UIDefine.mapDemo, { type: "view", layer: UILayer.View })`；原 loading 代码注释保留 |

### 5.1 MapGrid3D 接口

```ts
export interface MapGridConfig {
    cols: number;        // 8
    rows: number;        // 9
    tileSize: number;    // 512
    tilePath: (index: number) => string; // index: 1..72
    parent: Laya.Sprite3D;
}

export class MapGrid3D {
    static build(cfg: MapGridConfig): void;
}
```

创建流程：

1. 计算每个地块中心坐标 `(x, 0, z)`
2. 创建 `Sprite3D`，命名 `tile_XX`
3. 添加 `MeshFilter`，mesh 设为 `internal/Plane.lm`
4. 添加 `MeshRenderer`
5. 设置 `transform.localPosition` 与 `localRotation`（绕 X 转 -90°）
6. 加载对应 PNG，设置到 `UnlitMaterial.albedoTexture`

### 5.2 加载策略

- 使用 `Laya.loader.load(url, Loader.TEXTURE2D)` 预加载或逐块异步加载
- 为避免一帧创建 72 个 MeshRenderer 造成卡顿，可分帧创建（例如每帧创建 8~16 个）
- 贴图加载失败时打印日志，该地块显示为透明或默认色块

## 6. 数据流

```
entry.main
  → UIManager.CreateUI(UIDefine.mapDemo)
    → mapDemo.onInit
      → MapGrid3D.build({ cols: 8, rows: 9, tileSize: 512 })
        → 遍历 72 个地块
          → 创建 Sprite3D / MeshFilter / MeshRenderer
          → 异步加载 map/N.png → 设置 albedoTexture
      → 地块透视/缩放完全由 Camera 投影自动完成，无额外代码
```

## 7. 素材清单

| 文件 | 用途 |
|---|---|
| `assets/cdn/map/1.png` ~ `72.png` | 地块切片（实际 250×250，按 512×512 世界单位渲染） |

无需额外材质文件：运行时通过代码创建 `UnlitMaterial`。

## 8. 验证标准

1. 启动直进 `mapDemo`，无报错日志
2. 8×9 地图完整显示，地块之间无裂缝、无重叠
3. 轻微透视可见：屏幕下方（近处）地块略大，上方（远处）地块略小
4. 地块排列方向正确：编号 1 在左下角，72 在右上角
5. `Laya_ValidateLayaAsset` 校验 `mapDemo.ls` 通过
6. MCP play 运行预览视觉确认

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| Plane 默认朝向/UV 导致地图竖立或颠倒 | 在代码中设置 `localRotation` 绕 X `-90°`；必要时在 IDE 中预览并调整 |
| 72 个独立贴图造成加载卡顿 | 分帧创建地块；或先预加载再批量创建 |
| 相机高度/角度导致透视过强或过弱 | 提供可调常量，实现时通过 MCP play 即时微调 |
| 地块编号方向与预期相反 | 实现后通过日志或临时标注验证 1/8/65/72 四个角 |

## 10. 明确不做（YAGNI）

- 不做建筑、角色、路径往返
- 不做点击走位 / 寻路
- 不做相机滚动、拖拽、缩放
- 不做角色动画（Spine/帧动画）
- 不做多层远景视差
- 不做真实美术素材替换流程
- 不做合图 / 图集优化（本次直接使用 72 张独立 PNG）
