const { regClass } = Laya;
import LogMgr from "../../core/LogMgr";
import { IView } from "../../core/UIManage";
import { MapGrid3D } from "./MapGrid3D";
import { mapDemoBase } from "./mapDemo.generated";

/** 地图列数（x 轴） */
const MAP_COLS = 8;
/** 地图行数（z 轴） */
const MAP_ROWS = 9;
/** 单个地块世界尺寸 */
const MAP_TILE_SIZE = 512;
/** 每帧创建的地块数量 */
const MAP_BATCH_PER_FRAME = 8;

@regClass()
export class mapDemo extends mapDemoBase implements IView {

    private ground: Laya.Sprite3D;
    onInit(): void {
        this.ground = this.scene3D.getChildByName("Ground") as Laya.Sprite3D;
        LogMgr.log("mapDemo onInit");
        this._buildMap();
    }

    onOpened(param: any): void {
        this.ground = this.scene3D.getChildByName("Ground") as Laya.Sprite3D;
        LogMgr.log("mapDemo onInit");
        this._buildMap();
    }

    onShow(...args: any[]): void {
        LogMgr.log("mapDemo onShow", args);
    }

    onHide(): void {
        LogMgr.log("mapDemo onHide");
    }

    private _buildMap(): void {
        if (!this.ground) {
            LogMgr.error("mapDemo ground node not found");
            return;
        }

        MapGrid3D.build({
            cols: MAP_COLS,
            rows: MAP_ROWS,
            tileSize: MAP_TILE_SIZE,
            // 资源根为 assets/，因此路径不带 assets/ 前缀
            tilePath: (index) => `cdn/map/${index}.png`,
            parent: this.ground,
            batchPerFrame: MAP_BATCH_PER_FRAME,
        });
    }
}
