const { regClass } = Laya;
import LogMgr from "../../core/LogMgr";
import { IView } from "../../core/UIManage";
import { homeViewBase } from "./homeView.generated";

@regClass()
export class homeView extends homeViewBase implements IView {

    onInit(): void {
        LogMgr.log("homeView onInit");
        this.img.onClick(this, this.onTweenClick);
    }

    onShow(...args: any[]): void {
        LogMgr.log("homeView onShow");
    }

    private onTweenClick() {
        this.close();
    }
}