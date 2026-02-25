const { regClass } = Laya;
import { loadingBase } from "./loading.generated";

@regClass()
export class loading extends loadingBase {


    onAwake(): void {
        console.log("loading");
        this.btn_change.onClick(this, this.onChangeClick)
    }
    

    onOpened(param: any): void {
        console.log("loading opened", param);
    }

    onClosed(type?: string): void {
        console.log("loading closed", type);
    }

    onEnable(): void {
        console.log("loading enabled");
    }


    private onChangeClick(): void {
        this.btn_change.selected = !this.btn_change.selected;

        let index = this.btn_change.selected ? 1 : 0;
        this.img.getController("c1").selectedIndex = index;
        console.log("index", index);
        // if (this.btn_change.selected) {
        //     this.img.src = "internal/UI/list_item.png";
        // } else {
        //     this.img.src = "internal/UI/image.png";
        // }

    }
}