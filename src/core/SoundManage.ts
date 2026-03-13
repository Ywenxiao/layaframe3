import { IAudioAdapter } from "src/platform/sound/IAudioAdapter";

import soundAdapter from "src/platform/sound/LayaSoundAdapter";

/**
 * 声音管理器 - 详细实现
 * 负责背景音乐和音效的播放管理
 * 支持背景音乐淡入淡出切换、音效播放时压制背景音
 */
export class SoundManage {

    /** 背景音乐音量 (0-1) */
    private musicVolumeValue: number = 1;

    /** 音效音量 (0-1) */
    private soundVolumeValue: number = 1;

    /** 是否静音 */
    private mutedValue: boolean = false;

    /** 背景音乐是否静音 */
    private musicMutedValue: boolean = false;

    /** 音效是否静音 */
    private soundMutedValue: boolean = false;

    /** 是否启用音效压制背景音功能 */
    private enableSoundDuckValue: boolean = true;

    /** 音效压制背景音的目标音量比例 (0-1) */
    private duckTargetVolumeValue: number = 0.3;

    /** 音效压制持续时间 (毫秒) */
    private duckDurationValue: number = 100;

    /** 背景音恢复时间 (毫秒) */
    private duckRecoveryDurationValue: number = 500;

    /** 当前正在播放的背景音乐通道 */
    private currentMusicChannel: any = null;

    /** 当前背景音乐URL */
    private currentMusicUrl: string = "";

    /** 当前背景音乐循环次数 */
    private currentMusicLoop: number = 0;

    /** 背景音量恢复计时器ID */
    private recoverTimer: number = -1;

    /** 原始背景音量 (用于恢复) */
    private originalMusicVolume: number = 1;

    /** 淡入淡出动画是否正在进行 */
    private isFadingValue: boolean = false;

    /** 淡入淡出持续时间 (毫秒) */
    private fadeDurationValue: number = 500;

    /** 正在播放的音效通道映射 */
    private soundChannels: Map<string, any> = new Map();

    /** 音效通道列表（无key的） */
    private soundChannelList: any[] = [];

    /** 声音适配器 */
    private adapter: IAudioAdapter;

    constructor() {
        this.adapter = new soundAdapter();
    }


    // ==================== 音量控制 ====================

    /**
     * 设置背景音乐音量
     */
    setMusicVolume(value: number): void {
        if (value < 0) value = 0;
        if (value > 1) value = 1;

        this.originalMusicVolume = value;
        this.musicVolumeValue = value;

        if (!this.mutedValue && this.adapter) {
            this.adapter.setMusicVolume(value);
        }
    }

    /**
     * 获取背景音乐音量
     */
    getMusicVolume(): number {
        return this.originalMusicVolume;
    }

    /**
     * 设置音效音量
     */
    setSoundVolume(value: number, url?: string): void {
        if (value < 0) value = 0;
        if (value > 1) value = 1;

        this.soundVolumeValue = value;

        if (!this.mutedValue && this.adapter) {
            this.adapter.setSoundVolume(value, url);
        }
    }

    /**
     * 获取音效音量
     */
    getSoundVolume(): number {
        return this.soundVolumeValue;
    }

    // ==================== 静音控制 ====================

    /**
     * 设置是否静音（背景音乐和音效）
     */
    setMuted(value: boolean): void {
        if (this.mutedValue === value) return;

        this.mutedValue = value;

        if (this.adapter) {
            this.adapter.setMuted(value);
        }
    }

    /**
     * 获取是否静音（背景音乐和音效）
     */
    isMuted(): boolean {
        return this.mutedValue;
    }

    /**
     * 设置背景音乐是否静音
     */
    setMusicMuted(value: boolean): void {
        if (this.musicMutedValue === value) return;

        this.musicMutedValue = value;

        if (this.adapter) {
            this.adapter.setMusicMuted(value);
        }
    }

    /**
     * 获取背景音乐是否静音
     */
    isMusicMuted(): boolean {
        return this.musicMutedValue;
    }

    /**
     * 设置音效是否静音
     */
    setSoundMuted(value: boolean): void {
        if (this.soundMutedValue === value) return;

        this.soundMutedValue = value;

        if (this.adapter) {
            this.adapter.setSoundMuted(value);
        }
    }

    /**
     * 获取音效是否静音
     */
    isSoundMuted(): boolean {
        return this.soundMutedValue;
    }

    // ==================== 背景音乐控制 ====================

    /**
     * 播放背景音乐
     * @param url 音乐资源路径
     * @param loops 循环次数，0表示无限循环
     * @param fade 是否启用淡入淡出效果
     */
    playMusic(url: string, loops: number = 0, fade: boolean = true): void {
        if (!this.adapter) return;

        if (this.isFadingValue && url === this.currentMusicUrl) {
            return;
        }

        if (url === this.currentMusicUrl && this.currentMusicChannel && !this.adapter.isChannelStopped(this.currentMusicChannel)) {
            return;
        }

        this.currentMusicLoop = loops;
        this.isFadingValue = true;

        if (!this.currentMusicChannel || this.adapter.isChannelStopped(this.currentMusicChannel)) {
            this.playNewMusic(url, loops, fade);
        } else {
            this.fadeOutMusic(() => {
                this.playNewMusic(url, loops, fade);
            });
        }
    }

    /**
     * 停止背景音乐
     * @param fade 是否启用淡出效果
     */
    stopMusic(fade: boolean = true): void {
        if (!this.adapter) return;

        if (!this.currentMusicChannel || this.adapter.isChannelStopped(this.currentMusicChannel)) {
            return;
        }

        if (fade) {
            this.fadeOutMusic();
        } else {
            this.adapter.stopMusic();
            this.currentMusicChannel = null;
            this.currentMusicUrl = "";
            this.isFadingValue = false;
        }
    }

    /**
     * 暂停背景音乐
     */
    pauseMusic(): void {
        if (this.adapter) {
            this.adapter.stopMusic();
        }
    }

    /**
     * 恢复背景音乐
     */
    resumeMusic(): void {
        if (this.currentMusicUrl) {
            this.playMusic(this.currentMusicUrl, this.currentMusicLoop, false);
        }
    }

    /**
     * 播放新音乐
     */
    private playNewMusic(url: string, loops: number, fade: boolean): void {
        this.currentMusicUrl = url;
        this.currentMusicLoop = loops;

        this.currentMusicChannel = this.adapter.playMusic(url, loops);

        if (!fade) {
            this.isFadingValue = false;
            return;
        }

        this.adapter.setMusicVolume(0);
        this.tweenVolume(0, this.originalMusicVolume, this.fadeDurationValue, () => {
            this.isFadingValue = false;
        });
    }

    /**
     * 淡出背景音乐
     */
    private fadeOutMusic(callback?: Function): void {
        const originalVolume = this.originalMusicVolume;
        this.tweenVolume(this.originalMusicVolume, 0, this.fadeDurationValue, () => {
            this.adapter.stopMusic();
            this.currentMusicChannel = null;
            this.originalMusicVolume = originalVolume;
            this.isFadingValue = false;
            if (callback) {
                callback();
            }
        });
    }

    /**
     * 使用Tween实现音量渐变
     */
    private tweenVolume(from: number, to: number, duration: number, complete?: Function): void {
        if (!Laya.Tween) {
            this.adapter.setMusicVolume(this.mutedValue ? 0 : to);
            if (complete) complete();
            return;
        }

        const startTime = Date.now();
        const startVolume = from;
        const endVolume = to;

        const updateVolume = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const t = 1 - Math.pow(1 - progress, 2);
            const currentVolume = startVolume + (endVolume - startVolume) * t;

            this.adapter.setMusicVolume(this.mutedValue ? 0 : currentVolume);

            if (progress < 1) {
                requestAnimationFrame(updateVolume);
            } else {
                this.adapter.setMusicVolume(this.mutedValue ? 0 : endVolume);
                if (complete) complete();
            }
        };
        updateVolume();
    }

    // ==================== 音效控制 ====================

    /**
     * 播放音效
     * @param url 音效资源路径
     * @param loops 循环次数，0表示播放一次
     * @param key 音效唯一标识，用于停止指定音效
     * @param complete 播放完成回调
     */
    playSound(url: string, loops: number = 0, key?: string, complete?: () => void, startTime?: number): any {
        if (this.mutedValue || this.soundVolumeValue <= 0 || !this.adapter) {
            return null;
        }

        const channel = this.adapter.playSound(url, loops, complete, startTime);

        if (channel) {
            if (key) {
                this.soundChannels.set(key, channel);
            } else {
                this.soundChannelList.push(channel);
                this.cleanupSoundChannels();
            }

            if (this.enableSoundDuckValue && this.currentMusicChannel && !this.adapter.isChannelStopped(this.currentMusicChannel)) {
                this.startSoundDuck();
            }
        }

        return channel;
    }

    /**
     * 停止指定音效
     * @param key 音效唯一标识
     */
    stopSound(key: string): void {
        const channel = this.soundChannels.get(key);
        if (channel) {
            this.adapter.stopChannel(channel);
            this.soundChannels.delete(key);
        }
    }

    /**
     * 停止音效通道
     */
    stopSoundChannel(channel: any): void {
        if (channel) {
            this.adapter.stopChannel(channel);
        }
    }

    /**
     * 停止所有音效
     */
    stopAllSound(): void {
        if (this.adapter) {
            this.adapter.stopAllSound();
        }
        this.soundChannels.clear();
        this.soundChannelList.length = 0;
    }

    /**
     * 清理已停止的音效通道
     */
    private cleanupSoundChannels(): void {
        if (!this.adapter) {
            this.soundChannelList.length = 0;
            return;
        }
        this.soundChannelList = this.soundChannelList.filter(channel => {
            if (channel && this.adapter.isChannelStopped(channel)) {
                return false;
            }
            return true;
        });
    }

    /**
     * 开始音效压制背景音
     */
    private startSoundDuck(): void {
        if (!this.adapter) return;

        if (this.recoverTimer > -1) {
            this.adapter.clearTimer(this, this.recoverMusicVolume);
            this.recoverTimer = -1;
        }

        const targetVolume = this.duckTargetVolumeValue * this.originalMusicVolume;
        this.tweenVolume(this.getActualMusicVolume(), targetVolume, this.duckDurationValue);

        this.adapter.setTimer(this.duckRecoveryDurationValue, this, this.recoverMusicVolume);
    }

    /**
     * 恢复背景音音量
     */
    private recoverMusicVolume(): void {
        this.recoverTimer = -1;

        if (!this.adapter || !this.currentMusicChannel || this.adapter.isChannelStopped(this.currentMusicChannel)) {
            return;
        }

        this.tweenVolume(this.getActualMusicVolume(), this.originalMusicVolume, this.duckDurationValue);
    }

    // ==================== 参数配置 ====================

    /**
     * 设置是否启用音效压制背景音功能
     */
    setEnableSoundDuck(value: boolean): void {
        this.enableSoundDuckValue = value;
    }

    /**
     * 是否启用音效压制背景音
     */
    getEnableSoundDuck(): boolean {
        return this.enableSoundDuckValue;
    }

    /**
     * 设置音效压制背景音的目标音量
     * @param value 目标音量比例 (0-1)
     */
    setDuckTargetVolume(value: number): void {
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this.duckTargetVolumeValue = value;
    }

    /**
     * 获取音效压制目标音量
     */
    getDuckTargetVolume(): number {
        return this.duckTargetVolumeValue;
    }

    /**
     * 设置音效压制持续时间
     * @param value 持续时间 (毫秒)
     */
    setDuckDuration(value: number): void {
        if (value < 0) value = 0;
        this.duckDurationValue = value;
    }

    /**
     * 获取音效压制持续时间
     */
    getDuckDuration(): number {
        return this.duckDurationValue;
    }

    /**
     * 设置背景音恢复时间
     * @param value 恢复时间 (毫秒)
     */
    setDuckRecoveryDuration(value: number): void {
        if (value < 0) value = 0;
        this.duckRecoveryDurationValue = value;
    }

    /**
     * 获取背景音恢复时间
     */
    getDuckRecoveryDuration(): number {
        return this.duckRecoveryDurationValue;
    }

    /**
     * 设置淡入淡出持续时间
     * @param value 持续时间 (毫秒)
     */
    setFadeDuration(value: number): void {
        if (value < 0) value = 0;
        this.fadeDurationValue = value;
    }

    /**
     * 获取淡入淡出持续时间
     */
    getFadeDuration(): number {
        return this.fadeDurationValue;
    }

    /**
     * 获取当前音乐播放状态
     */
    isMusicPlaying(): boolean {
        return !!this.currentMusicChannel && this.adapter && !this.adapter.isChannelStopped(this.currentMusicChannel);
    }

    /**
     * 获取当前播放的音乐URL
     */
    getCurrentMusicUrl(): string {
        return this.currentMusicUrl;
    }

    /**
     * 获取正在播放的音效数量
     */
    getSoundCount(): number {
        this.cleanupSoundChannels();
        return this.soundChannels.size + this.soundChannelList.length;
    }

    /**
     * 获取是否正在淡入淡出
     */
    isFading(): boolean {
        return this.isFadingValue;
    }

    /**
     * 获取实际当前音量
     */
    private getActualMusicVolume(): number {
        if (this.adapter) {
            return this.adapter.getMusicVolume();
        }
        return this.musicVolumeValue;
    }

    // ==================== 音量属性访问 ====================

    // ==================== 资源清理 ====================

    /**
     * 清理资源
     */
    dispose(): void {
        if (this.recoverTimer > -1 && this.adapter) {
            this.adapter.clearTimer(this, this.recoverMusicVolume);
            this.recoverTimer = -1;
        }
        this.stopAllSound();
        this.stopMusic(false);
    }

    // ==================== 适配器设置 ====================

    /**
     * 设置声音适配器
     * @param adapter 声音适配器实例
     */
    setAdapter(adapter: IAudioAdapter): void {
        this.adapter = adapter;
    }

    /**
     * 获取声音适配器
     */
    getAdapter(): IAudioAdapter {
        return this.adapter;
    }
}
