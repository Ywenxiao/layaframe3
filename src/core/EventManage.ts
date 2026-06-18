import { Context, INJECT, WITHCONTEXT } from "./Context";
import { ContextType } from "./DefineTypes";

@INJECT(ContextType.SYSTEM, false)
export class EventManage extends WITHCONTEXT(Laya.EventDispatcher) {

    constructor() {
        super();
    }

} 