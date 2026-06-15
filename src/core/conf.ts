
export class conf {
    private static mUser = {};
    private static tick: number;

    static mLoginTickKey: string;

    static readonly version = '0.0.1';

    static readonly release = false;

    static readonly saveData = {};

    static readonly show_log_call = false;

    static itemsPath: string;


    static init() {
        // conf.mLoginTickKey = (new Date().getTime()).toString() + utils.randstr(16);
    }


    static getUID() {
        return this.mUser['uid'];
    }

    static getServerTime2() {

    }

    static getOther_f_c(): number {

        return 0;

        // let json = conf.getValueJson("3");
        // let wait_time = 1;
        // if (!isNaN(json['useing_f_c'])) {
        //     wait_time = Number(json['useing_f_c']);
        // }
        // return wait_time;
    }

}