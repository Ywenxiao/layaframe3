# 3D 相机渲染 2D 地图（近大远小）演示 — 设计文档

- 日期：2026-09-08
- 状态：已确认
- 范围：效果验证演示（占位素材，不含完整地图系统）

## 1. 目标

在 layaframe3（LayaAir 3.x、ui2 模式）中用 **3D 相机渲染 2D 风格地图**，实现"近大远小"透视效果演示：

- 斜视角地图（地面 + 建筑 + 角色），角色沿预置路径自动往返
- 近大远小由透视相机投影自动产生，脚本零缩放/排序代码
- 建筑遮挡由深度缓冲自动处理
- 占位素材验证，启动直进演示

## 2. 需求（澄清结论）

| 问题 | 结论 |
|---|---|
| 实现范围 | 只要近大远小核心效果（后续再扩展寻路、相机滚动等） |
| 素材 | 先用代码生成的占位图验证，后续替换真实素材 |
| 角色运动 | 沿预置路径自动往返 |
| 建筑遮挡 | 含（角色走到建筑后应被遮住） |
| 入口 | 启动直进演示（main 改为打开 mapDemo，loading 代码注释保留） |

## 3. 方案对比与选择

### 方案 A：纯 2D y 伪透视（否决）

y 驱动手动缩放（`scale = camZ/(camZ+z)`）+ zOrder 排序遮挡。
优点：零引擎依赖、性能最好。缺点：无水平汇聚、每帧手写缩放/排序逻辑——与本次"用 3D 相机"的目标不符。

### 方案 B：Scene3D + 透视相机 + Unlit 材质平面（选定）

斜视角透视相机看平躺地面，地面/建筑/角色均为贴图平面。
优点：近大远小与遮挡全部由渲染管线自动完成；`internal/Plane.lm` 内置网格免建模。
缺点：素材需贴到 3D 平面（占位阶段无感）。

### 方案 C：2D 相机 / 自定义 2D shader（不可行）

经 `engine/types/LayaAir.d.ts` 核实：本版本无公开 2D 相机类（`Laya.Camera extends BaseCamera extends Sprite3D` 为 3D 相机），纯 2D `Sprite` 无公开自定义 shader/material 挂载点（2D shader 均为引擎内部类）。

## 4. 引擎事实依据

- `Laya.Camera`：`orthographic = false` + `fieldOfView` 即透视投影
- `Scene.bridge3D.orthographicCamera = false` 可开桥接透视模式（本次不用，备选方案记录）
- `internal/Plane.lm` 内置平面网格可直接被 `.ls` 引用（IDE 模板 `RenderScene.ls` 确认，MeshFilter/MeshRenderer 结构有现成样例）
- 2D/3D 混合约定：Scene3D 节点作为场景根节点 `_$child` 的第一个子节点
- 场景 `.ls` 编辑必须走 IDE MCP（`Laya_EditAsset`），写后可用 `Laya_ValidateLayaAsset` 校验

## 5. 场景结构（`assets/view/map/mapDemo.ls`）

```
Scene2D（根，_$runtime: mapDemo.ts）
└── Scene3D（第一个子节点）
    ├── Main Camera    Camera：透视（orthographic=false）、fov 60、
    │                  localPosition (0, 700, -900)、俯角约 35~45° 斜视地面
    ├── DirectionLight Sprite3D + DirectionLightCom（3D 管线光照，保底）
    ├── Ground         Sprite3D + MeshFilter(internal/Plane.lm) + MeshRenderer(Unlit 地面材质)
    │                  平躺地面（绕 X 转 -90°），2000×3000 单位，贴"网格+道路"占位图
    ├── Building       Sprite3D + MeshFilter(internal/Plane.lm) + MeshRenderer(Unlit 建筑材质)
    │                  直立四边形立在地面上，位于路径中部
    └── Role           Sprite3D + MeshFilter(internal/Plane.lm) + MeshRenderer(Unlit 角色材质)
                       直立公告板（面向相机），贴占位角色图
```

相机参数：fov 60、nearPlane 0.3、farPlane 5000（保证地面远端在裁剪范围内）。
远处 = 地面 z 负向深处（屏幕上方向），近处 = z 接近相机侧（屏幕下方向）。

## 6. 脚本设计

| 文件 | 职责 |
|---|---|
| `src/view/map/mapDemo.ts` | 视图脚本（`@regClass()` + 实现 IView）：onInit 拿场景引用、配置路径点、`Laya.timer.frameLoop` 驱动角色沿折线匀速往返 |
| `src/view/map/MapPath3D.ts` | 纯逻辑类：3D 折线路径插值（匀速推进 + 端点折返），无引擎依赖、可独立验证 |
| `src/view/map/mapDemo.generated.ts` | 仿 IDE 生成格式手写基类（`extends Laya.Scene`，声明 `_$var` 节点字段） |
| `src/patch/UIDefine.ts` | 增加 `mapDemo = "view/map/mapDemo.ls"` |
| `src/entry.ts` | main 改为 `CreateUI(UIDefine.mapDemo, { type: "view", layer: UILayer.View })`；原 loading 代码注释保留 |

路径点配置：mapDemo.ts 内常量数组（3~5 个 (x, z) 地面点，从远到近再折返），占位阶段硬编码，后续可外置配置。

边界处理：路径点不足 2 个时跳过移动并打日志；路径段长度为 0 时跳过该段。

## 7. 素材与材质清单

占位 PNG（一次性 Node 脚本直绘 RGBA 缓冲生成，放 `assets/resources/map/`，由 IDE 导入）：

| 文件 | 内容 |
|---|---|
| `map_ground.png` | 512×512 地面网格 + 中央道路色带（斜视下形成透视参考线） |
| `map_building.png` | 建筑色块（带门窗示意，不透明） |
| `map_role.png` | 角色圆块/人形剪影（带 alpha 透明通道） |

材质（MCP `createMaterial` Unlit 模板创建 3 个 `.lmat`，`Laya_EditAsset` 设置 albedoTexture 指向对应 PNG）：

- 地面/建筑材质：不透明（默认 renderMode）
- 角色材质：透明混合 + 双面渲染（具体字段值实现时对照 IDE lmat 样例与 d.ts 确认）

所有平面复用 `internal/Plane.lm`，无模型文件。

## 8. 数据流

```
entry.main
  → UIManager.CreateUI("view/map/mapDemo.ls")
    → mapDemo.onInit
      → 初始化 MapPath3D（路径点、速度）
      → Laya.timer.frameLoop 每帧：
          t += dt → 路径插值出 (x, z)
          → role.transform.position = (x, 0, z)
          （缩放/遮挡由透视相机与深度缓冲自动完成，无额外代码）
```

## 9. 验证标准

1. 启动直进演示，无报错日志
2. 斜视角地面网格透视清晰，近大远小可直观看出来
3. 角色沿路径往返：远端变小、近端变大，过渡连续无跳变
4. 角色经过建筑时前后遮挡关系正确（建筑后经过被遮、建筑前经过遮建筑）
5. `Laya_ValidateLayaAsset` 校验 mapDemo.ls 通过
6. MCP play 运行预览视觉确认

## 10. 风险与对策

| 风险 | 对策 |
|---|---|
| 3D 节点 JSON 写法不熟悉 | IDE 模板 `RenderScene.ls` / `3D-emptyProject/Scene.ls` 有完整样例；`Laya_ValidateLayaAsset` 校验兜底 |
| UnlitMaterial 透明/双面参数字段名 | 实现时对照 IDE 内 lmat 样例与 d.ts 字段确认，必要时用 `Laya_EditAsset` 试验后校验 |
| 2D UI 层与 3D 叠放 | 演示无 UI 覆盖；验证时观察 Scene3D 与 2D 层渲染顺序是否符合预期 |
| MCP 返回数据 `_$` 前缀丢失 | 编辑时始终使用带下划线格式（`_$type` 等） |

## 11. 明确不做（YAGNI）

- 不做点击走位 / 寻路
- 不做相机滚动、拖拽、缩放
- 不做角色动画（Spine/帧动画）
- 不做多层远景视差
- 不做真实美术素材替换流程
