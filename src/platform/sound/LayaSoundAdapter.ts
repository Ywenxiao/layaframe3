import { IAudioAdapter } from "./IAudioAdapter";

export default class LayaSoundAdapter implements IAudioAdapter {

    playMusic(url: string, loops?: number, complete?: () => void, startTime?: number) {
        return Laya.SoundManager.playMusic(url, loops, complete, startTime);
    }
    stopMusic(): void {
        return Laya.SoundManager.stopMusic();
    }
    playSound(url: string, loops?: number, complete?: () => void, startTime?: number) {
        return Laya.SoundManager.playSound(url, loops, complete, startTime);
    }
    stopSound(url: string): void {
        return Laya.SoundManager.stopSound(url);
    }
    stopAllSound(): void {
        return Laya.SoundManager.stopAllSound();
    }
    stopChannel(channel: any): void {
        if (channel && channel.url) {
            Laya.SoundManager.stopSound(channel.url);
        }
    }

    isChannelStopped(channel: any): boolean {
        if (channel && channel.url) {
            let c = Laya.SoundManager.findChannel(channel.url);
            if (c) {
                return c.isStopped;
            }
        }
        return true;
    }

    setMusicVolume(volume: number): void {
        Laya.SoundManager.musicVolume = volume;
    }
    getMusicVolume(): number {
        return Laya.SoundManager.musicVolume;
    }
    setSoundVolume(volume: number, url?: string): void {
        Laya.SoundManager.soundVolume = volume;
    }
    getSoundVolume(): number {
        return Laya.SoundManager.soundVolume;
    }
    setMuted(value: boolean): void {
        Laya.SoundManager.muted = value;
    }
    getMuted(): boolean {
        return Laya.SoundManager.muted;
    }
    setMusicMuted(value: boolean): void {
        Laya.SoundManager.musicMuted = value;
    }
    getMusicMuted(): boolean {
        return Laya.SoundManager.musicMuted;
    }
    setSoundMuted(value: boolean): void {
        Laya.SoundManager.soundMuted = value;
    }
    getSoundMuted(): boolean {
        return Laya.SoundManager.soundMuted;
    }

    setPlaybackRate(rate: number): void {
        Laya.SoundManager.playbackRate = rate;
    }
    getPlaybackRate(): number {
        return Laya.SoundManager.playbackRate;
    }

    stopAll(): void {
        Laya.SoundManager.stopAll();
    }

}