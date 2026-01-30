const { regClass } = Laya;
import { loadingBase } from "./loading.generated";

@regClass()
export class loading extends loadingBase {


    onAwake(): void {
        console.log("loading");
        this.btn_change.onClick(this, this.onChangeClick)
    }

    onOpened(param: any): void {

    }

    onClosed(type?: string): void {

    }


    private onChangeClick(): void {
        this.btn_change.selected = !this.btn_change.selected;

        if (this.btn_change.selected) {
            this.img.src = "internal/UI/list_item.png";
        } else {
            this.img.src = "internal/UI/image.png";
        }

    }
}