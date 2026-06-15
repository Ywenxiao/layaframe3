import apk from "./apk";
import LogMgr from "./LogMgr";

export default class SoundManager {

    private static _uo: SoundManager = null;

    private static nowMusic: string = "";
    private static lastMusic: string = "";

    // public static get uo(): SoundManager {
    //     return SoundManager.getInst();
    // }

    /**需要在分包加载之后再调用 */
    // static getInst(): SoundManager {
    //     if (!SoundManager._uo) {
    //         SoundManager._uo = new SoundManager();
    //     }
    //     return SoundManager._uo;
    // }

    static clearSound() {

        if (SoundManager._uo) {
            SoundManager._uo.stopAllEffect();
            SoundManager._uo.stopMusic();
        }

        this._uo = null;

        this.nowMusic = "";
        this.lastMusic = "";
    }

    //=========================================================


    /**
     * 所有音效在这里注册
     * 音效 @local/ 是动态替换目录
     */
    public sounds = {
        bg: "@local/bg_new1.mp3",// 1.bg：合成背景音乐
        btn: "cdn/sounds/click.wav",// 2.btn：按钮点击、弹框打开
        get_item: "cdn/sounds/get_item.wav",// 3.get_item：道具获得（购买道具、道具放到仓库）
        drop: "cdn/sounds/drop.wav",// 4.drop：点击道具产出碎片
        merge1: "cdn/sounds/new_merge1.wav",// 6.merge1：等级1合成时
        merge2: "cdn/sounds/new_merge2.wav",// 7.merge2：等级2合成时
        merge3: "cdn/sounds/new_merge3.wav",// 8.merge3：等级3合成时
        merge4: "cdn/sounds/new_merge4.wav",// 9.merge4：等级4合成时
        merge5: "cdn/sounds/new_merge5.wav",// 10.merge5：等级5合成时
        merge6: "cdn/sounds/new_merge6.wav",// 11.merge6：等级6合成时
        merge7: "cdn/sounds/new_merge7.wav",// 12.merge7：等级7合成时
        merge8: "cdn/sounds/new_merge8.wav",// 13.merge8：等级8级及以上合成时
        get_exp: "cdn/sounds/get_exp.wav",// 14.get_exp：获得经验值（点击格子上的经验值）
        lvup: "cdn/sounds/lvup.wav",// 15.lvup：点击升级按钮
        get_money: "cdn/sounds/get_money.wav",// 16.get_money：获得钻石（点击格子上的钻石）
        get_bubble: "cdn/sounds/get_bubble.wav",// 17.get_bubble：出现气泡道具
        break: "cdn/sounds/break.wav",// 18.break：打破气泡

        get_tili: "cdn/sounds/get_tili.wav",// 20.get_tili：获得体力（点击格子上的体力）
        get_gold: "cdn/sounds/get_gold.wav",// 21.get_gold：获得金币（点击格子上的金币）
        add: "cdn/sounds/add.wav",// 22.add：金币钻石经验值体力增加
        reward: "cdn/sounds/reward.wav",

        get_reward: "cdn/sounds/get_reward.wav",
        build: "cdn/sounds/build.wav",
        flash: "cdn/sounds/flash.wav",
    }

    public isEfeect: boolean = true;
    public isBack: boolean = true;


    constructor() {
        SoundManager._uo = this;

        this.init();
    }

    //默认背景音乐使用mp3,音效使用wav
    private init(): void {

        //音效自定义目录
        let replaceLocal = "cdn/sounds/", replaceCdn = "cdn/sounds/";

        //音效后缀,背景音乐也一起替换
        let sound_ext = ".wav", bg_replace = false;;

        //音效本地目录
        if (this.use_fb_assets()) {
            replaceLocal = "fb_cdn/sounds/";
        }

        //淘宝使用本地
        // if (apk.isTaobao()) {
        //     sound_ext = ".mp3";
        //     replaceCdn = "sound/";
        //     replaceLocal = "sound/";
        // }

        // if (apk.isAli()) {
        //     sound_ext = ".mp3";
        //     replaceCdn = "fb_cdn/sounds/";
        //     replaceLocal = "fb_cdn/sounds/";
        // }

        // if (apk.isOhosApp()) {
        //     bg_replace = true;
        // }


        for (let kk in this.sounds) {
            let url = this.sounds[kk];
            if (typeof url !== "string") {
                continue;
            }

            if (replaceCdn != "cdn/sounds/") {
                url = url.replace("cdn/sounds/", replaceCdn);
            }

            //替换背景音乐
            if (url.startsWith("@local/")) {
                url = url.replace("@local/", replaceLocal);

                //背景音乐也一起替换
                if (bg_replace) {
                    url = url.replace(".mp3", sound_ext);
                }
            }

            if (sound_ext != ".wav") {
                url = url.replace(".wav", sound_ext);
            }

            // url = url.replace(".wav", sound_ext).replace("@local/", replaceLocal).replace("cdn/sounds/", replaceCdn);

            this.sounds[kk] = url;
        }

        if (apk.getItem("op_sound_effect") == null || apk.getItem("op_sound_effect") == "") {
            apk.setItem("op_sound_effect", "1");
            this.isEfeect = true;
        }
        else if (Number(apk.getItem("op_sound_effect")) == 1) {
            this.isEfeect = true;

        } else {
            this.isEfeect = false;
        }

        if (apk.getItem("op_sound_back") == null || apk.getItem("op_sound_back") == "") {
            apk.setItem("op_sound_back", "1");
            this.isBack = true;
        }
        else if (Number(apk.getItem("op_sound_back")) == 1) {
            this.isBack = true;

        } else {
            this.isBack = false;
        }
    }

    public stopAllEffect(): void {

        Laya.SoundManager.stopAllSound();

    }

    /**
     * 播放音效
     * @param sound 
     * @param vol 
     */
    public playEffect(sound: string, callBack: Function = null) {
        // LogMgr.log("playEffect:"+sound);
        if (this.isEfeect == false) return;

        let eff_url = this.sounds[sound];
        if (!eff_url) {
            LogMgr.log("playEffect Error no:" + sound);
            return;
        }

        eff_url = Laya.URL.formatURL(eff_url);

        //有实现就用自定义播放
        if (apk.getApp().playSound) {

            apk.getApp().playSound(eff_url, callBack);
            return;
        }

        // LogMgr.log("playSound:" + eff_url);
        try {
            Laya.SoundManager.playSound(eff_url, 1, Laya.Handler.create(this, () => { callBack && callBack() }));
        } catch (e) {
            // console.log("error effect:" , eff_url , e) ;
        }
    }

    public stopEffect(eff_url: string): void {
        eff_url = Laya.URL.formatURL(eff_url);
        Laya.SoundManager.stopSound(eff_url);
    }

    public playMusic(music: string, loop: number = 1, vol: number = 1) {
        if (this.isBack == false) return;
        if (music != "") {
            SoundManager.nowMusic = music;
        } else {
            music = SoundManager.nowMusic;
        }

        let play_url = this.sounds[music];
        if (!play_url) {
            LogMgr.log("playMusic Error no:" + music);
            return;
        }

        play_url = Laya.URL.formatURL(play_url);

        //有实现就用自定义播放
        if (apk.getApp().playMusic) {
            apk.getApp().playMusic(play_url);
            return;
        }

        if (Laya.SoundManager["_bgMusic"] === play_url) {
            return;
        }

        Laya.SoundManager.stopAll();
        Laya.SoundManager.stopMusic();
        try {
            Laya.SoundManager.playMusic(play_url, 0);
        } catch (e) {
            // console.log("error effect:" , eff_url , e) ;
        }

    }

    public setLastMusic(): void {
        if (SoundManager.lastMusic != "") {
            return
        }
        SoundManager.lastMusic = SoundManager.nowMusic;
    }

    public restartLastBgm(): void {
        if (SoundManager.lastMusic != "") {
            this.playMusic(SoundManager.lastMusic);
            SoundManager.lastMusic = "";
        }
    }

    public restartBgm(): void {
        if (SoundManager.nowMusic != "") {
            this.playMusic(SoundManager.nowMusic);
        }
    }

    public puaseMusic() {
        this.stopMusic();
    }

    public stopMusic(): void {
        if (apk.getApp().stopMusic) {
            apk.getApp().stopMusic();
            return;
        }

        Laya.SoundManager.stopMusic();
    }

    //type 1 音乐 2 音效 
    public mute(type: number): void {
        if (type == 1) {
            this.isBack = !this.isBack;
            if (this.isBack) {
                apk.setItem("op_sound_back", "1");
                this.playMusic("bg");

            } else {
                apk.setItem("op_sound_back", "0");
                this.stopMusic();
            }

        } else {
            this.isEfeect = !this.isEfeect;
            if (this.isEfeect) {
                apk.setItem("op_sound_effect", "1");
            } else {
                apk.setItem("op_sound_effect", "0");
                this.stopAllEffect();
            }

        }
    }

    private use_fb_assets() {
        if (apk.getApp().subpack_use === true) {
            return true;
        }

        // if (apk.isCydyTt()) {
        //     return true;
        // }

        return false;
    }
}