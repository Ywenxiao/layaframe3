const { regClass } = Laya;
import apk from "../../core/apk";
import { GET } from "../../core/Context";
import LogMgr from "../../core/LogMgr";
import { Spinemanage } from "../../core/SpineManage";
import { IView, UILayer, UIManager } from "../../core/UIManage";
import { UIDefine } from "../../patch/UIDefine";
import { loadingBase } from "./loading.generated";

@regClass()
export class loading extends loadingBase implements IView {

    private btn: Laya.GButton;
    onInit(): void {

        this.width = 750;
        this.height = Laya.stage.height;
        if (this.height > 1666) {
            this.img_bg.height = this.height;
        }

        this.btn_select.icon = "atlas/comp/button.png";
        this.btn_select.onClick(this, this.onTweenClick);

        if (apk.isPad()) {
            let img = new Laya.GImage();
            img.src = apk.resCDN() + "bgs/pad_bg.jpg";
            img.size(Laya.stage.width, Laya.stage.height);
            Laya.stage.addChildAt(img, 0);
        }

        Laya.loader.fetch("resources/apk/version.txt", Laya.Loader.TEXT).then((text: any) => {
            this.txt_version.text = text;
        });

        GET(Spinemanage).showAnim(apk.resLocal() + "apk/qijigongchang.skel", {
            parent: this,
            x: this.width >> 1,
            y: this.height + 100,
            olderIndex: 1,
            anchor: Laya.Vector2.TEMP.setValue(0.5, 1),
        })
    }

    clear() {

    }

    onShow(...args: any[]): void {
        LogMgr.log("loading show");
    }

    onClear(reason: string): void {
        console.log("loading clear", reason);
    }

    onDispose(): void {
        console.log("loading dispose");
    }

    private onTweenClick(): void {
        GET(UIManager).CreateUI(UIDefine.home, { type: "view", layer: UILayer.DialogTop });

    }
}