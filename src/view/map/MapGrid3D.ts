import LogMgr from "../../core/LogMgr";

export interface MapGridConfig {
    /** 列数（x 轴） */
    cols: number;
    /** 行数（z 轴） */
    rows: number;
    /** 单个地块世界尺寸 */
    tileSize: number;
    /** 地块索引 1..N -> 贴图资源路径 */
    tilePath: (index: number) => string;
    /** 父节点 */
    parent: Laya.Sprite3D;
    /** 每帧创建数量，避免单帧创建过多造成卡顿 */
    batchPerFrame?: number;
}

export class MapGrid3D {
    /**
     * 在 parent 下创建 cols × rows 的地块网格。
     * 编号规则：row 从底（近处）到顶（远处），col 从左到右；index = row * cols + col + 1。
     * 地块透视与缩放完全由相机投影产生，此处不做任何手动缩放或排序。
     */
    static build(cfg: MapGridConfig): void {
        const { cols, rows, tileSize, tilePath, parent, batchPerFrame = 8 } = cfg;
        const total = cols * rows;
        // 使地图整体以世界原点为中心
        const offsetX = ((cols - 1) * tileSize) / 2;
        const offsetZ = ((rows - 1) * tileSize) / 2;

        // 所有地块共享同一份 Plane 网格，只有材质（贴图）各不相同
        const sharedMesh = Laya.PrimitiveMesh.createPlane(tileSize, tileSize);

        let created = 0;
        const createBatch = () => {
            const end = Math.min(created + batchPerFrame, total);
            for (let i = created; i < end; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const index = i + 1;

                const x = col * tileSize - offsetX;
                // 相机位于 +Z 侧俯视，屏幕上方对应 -Z，因此底行(row 0)应放在 +Z
                const z = offsetZ - row * tileSize;

                const tile = new Laya.Sprite3D(`tile_${index.toString().padStart(2, "0")}`);
                tile.transform.localPosition = new Laya.Vector3(x, 0, z);
                // PrimitiveMesh.createPlane 生成的平面本身就是 XZ 水平面（法线 +Y），无需旋转

                const meshFilter = tile.addComponent(Laya.MeshFilter);
                meshFilter.sharedMesh = sharedMesh;

                const meshRenderer = tile.addComponent(Laya.MeshRenderer);
                const material = new Laya.UnlitMaterial();
                material.renderMode = Laya.UnlitMaterial.RENDERMODE_OPAQUE;
                meshRenderer.sharedMaterial = material;

                MapGrid3D._loadTexture(tilePath(index), material);

                parent.addChild(tile);
            }
            created = end;
            if (created < total) {
                Laya.timer.frameOnce(1, MapGrid3D, createBatch);
            } else {
                LogMgr.log(`[MapGrid3D] built ${total} tiles (${cols} x ${rows}, size ${tileSize})`);
            }
        };

        createBatch();
    }

    private static _loadTexture(url: string, material: Laya.UnlitMaterial): void {
        Laya.loader.load(url, Laya.Loader.TEXTURE2D).then((tex: Laya.Texture2D) => {
            if (!tex) {
                LogMgr.error(`[MapGrid3D] tile texture is null: ${url}`);
                return;
            }
            material.albedoTexture = tex;
        }).catch((err: any) => {
            LogMgr.error(`[MapGrid3D] failed to load tile texture: ${url}`, err);
        });
    }
}
