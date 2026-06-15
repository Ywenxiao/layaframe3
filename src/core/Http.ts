import { INJECT } from "./Context";
import { ContextType } from "./DefineTypes";

@INJECT(ContextType.SYSTEM, false)
export class Http {

    call(cmd: string, param: any) {

    }

}