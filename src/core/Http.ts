import { INJECT, Injectable } from "./Context";
import { ContextType } from "./DefineTypes";

@INJECT(ContextType.SYSTEM, false)
export class Http extends Injectable {

    call(cmd: string, param: any) {

    }

}