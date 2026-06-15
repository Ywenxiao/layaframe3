const { regClass } = Laya;
import apk from "../../core/apk";
import { IView } from "../../core/UIManage";
import { loadingBase } from "./loading.generated";

@regClass()
export class loading extends loadingBase implements IView {

    onInit(): void {
        console.log("loading init");

        this.width = 750;
        this.height = Laya.stage.height;
        if (this.height > 1666) {
            this.img_bg.height = this.height;
        }

        if (apk.isPad()) {
            let img = new Laya.GImage();
            img.src = apk.resCDN() + "bgs/pad_bg.jpg";
            img.size(Laya.stage.width, Laya.stage.height);
            Laya.stage.addChildAt(img, 0);
        }

        Laya.loader.fetch("resources/apk/version.txt", Laya.Loader.TEXT).then((text: any) => {
            this.txt_version.text = text;
        });
    }

    onShow(...args: any[]): void {
        console.log("loading show");
    }

    onClear(reason: string): void {
        console.log("loading clear", reason);
    }

    onDispose(): void {
        console.log("loading dispose");
    }

    private onTweenClick(): void {
        console.log("onTweenClick");
        let path = new Laya.CurvePath();

    }
}