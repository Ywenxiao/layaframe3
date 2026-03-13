/**
 * 音频适配器接口
 * 抽象音频播放逻辑，便于替换不同的音频引擎
 * 基于 Laya.SoundManager API 设计
 */
export interface IAudioAdapter {

    // ==================== 背景音乐控制 ====================

    /**
     * 播放背景音乐
     * @param url 音乐资源路径
     * @param loops 循环次数，0表示无限循环
     * @param complete 播放完成回调
     * @param startTime 开始播放时间（毫秒）
     * @returns 音频通道对象 (SoundChannel)
     */
    playMusic(url: string, loops?: number, complete?: () => void, startTime?: number): any;

    /**
     * 停止背景音乐
     */
    stopMusic(): void;

    // ==================== 音效控制 ====================

    /**
     * 播放音效
     * @param url 音效资源路径
     * @param loops 循环次数，0表示播放一次
     * @param complete 播放完成回调
     * @param startTime 开始播放时间（毫秒）
     * @returns 音频通道对象 (SoundChannel)
     */
    playSound(url: string, loops?: number, complete?: () => void, startTime?: number): any;

    /**
     * 停止指定音效
     * @param url 音效资源路径
     */
    stopSound(url: string): void;

    /**
     * 停止所有音效
     */
    stopAllSound(): void;

    // ==================== 音量控制 ====================

    /**
     * 设置背景音乐音量
     * @param volume 音量值 (0-1)
     */
    setMusicVolume(volume: number): void;

    /**
     * 获取背景音乐音量
     */
    getMusicVolume(): number;

    /**
     * 设置音效音量
     * @param volume 音量值 (0-1)
     */
    setSoundVolume(volume: number, url?: string): void;

    /**
     * 获取音效音量
     */
    getSoundVolume(): number;

    // ==================== 静音控制 ====================

    /**
     * 设置是否静音（背景音乐和音效）
     * @param value 是否静音
     */
    setMuted(value: boolean): void;

    /**
     * 获取是否静音（背景音乐和音效）
     */
    getMuted(): boolean;

    /**
     * 设置背景音乐是否静音
     * @param value 是否静音
     */
    setMusicMuted(value: boolean): void;

    /**
     * 获取背景音乐是否静音
     */
    getMusicMuted(): boolean;

    /**
     * 设置音效是否静音
     * @param value 是否静音
     */
    setSoundMuted(value: boolean): void;

    /**
     * 获取音效是否静音
     */
    getSoundMuted(): boolean;

    // ==================== 全局控制 ====================

    /**
     * 停止所有声音（包括背景音乐和音效）
     */
    stopAll(): void;

    /**
     * 设置播放速率
     * @param rate 播放速率，1为正常速度
     */
    setPlaybackRate(rate: number): void;

    /**
     * 获取播放速率
     */
    getPlaybackRate(): number;
  
}
