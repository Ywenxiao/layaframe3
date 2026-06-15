/**
 * Label 数字缓动工具
 * 使用全局单循环驱动所有动画，避免每标签一个 frameLoop 的性能问题
 */

export enum EaseType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut
}

export interface ILabelTweenOptions {
    /** 缓动类型，默认 EaseOut */
    ease?: EaseType;
    /** 数值格式化，默认 Math.round */
    format?: (val: number) => string;
    /** 是否带缩放弹跳效果 */
    scaleEffect?: boolean;
    /** 每帧更新回调 */
    onUpdate?: (current: number) => void;
    /** 完成回调 */
    onComplete?: () => void;
}

interface TweenState {
    label: Laya.Label | Laya.Text;
    from: number;
    to: number;
    duration: number;
    ease: EaseType;
    format: (val: number) => string;
    scaleEffect: boolean;
    onUpdate?: (current: number) => void;
    onComplete?: () => void;
    startTime: number;
    startScaleX: number;
    startScaleY: number;
}

export class LabelTweenUtil {

    private static tweens: TweenState[] = [];
    private static running = false;

    /**
     * 对 Label 播放数字跳动动画
     * @param label 目标 Label
     * @param from  起始数值
     * @param to    目标数值
     * @param duration 动画时长（毫秒）
     * @param options  可选配置
     */
    static play(
        label: Laya.Label | Laya.Text,
        from: number,
        to: number,
        duration: number,
        options?: ILabelTweenOptions
    ): void {
        if (!label || label.destroyed) return;

        // 同一 label 移除旧动画
        this.tweens = this.tweens.filter(t => t.label !== label);

        const fmt = options?.format ?? ((v: number) => Math.round(v).toString());
        const ease = options?.ease ?? EaseType.EaseOut;

        // 立即显示起始值
        label.text = fmt(from);

        const state: TweenState = {
            label,
            from,
            to,
            duration,
            ease,
            format: fmt,
            scaleEffect: options?.scaleEffect ?? false,
            onUpdate: options?.onUpdate,
            onComplete: options?.onComplete,
            startTime: Laya.Browser.now(),
            startScaleX: label.scaleX,
            startScaleY: label.scaleY,
        };

        this.tweens.push(state);
        this.ensureLoop();
    }

    /** 停止某个 label 上的动画 */
    static stop(label: Laya.Label | Laya.Text): void {
        const idx = this.tweens.findIndex(t => t.label === label);
        if (idx !== -1) {
            this.tweens.splice(idx, 1);
        }
        if (this.tweens.length === 0) {
            this.stopLoop();
        }
    }

    /** 停止所有动画 */
    static stopAll(): void {
        this.tweens.length = 0;
        this.stopLoop();
    }

    // ---- 内部 ----

    private static ensureLoop(): void {
        if (!this.running) {
            this.running = true;
            Laya.timer.frameLoop(3, this, this.updateAll);
        }
    }

    private static stopLoop(): void {
        if (this.running) {
            Laya.timer.clear(this, this.updateAll);
            this.running = false;
        }
    }

    private static updateAll(): void {
        const now = Laya.Browser.now();
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            if (this.updateOne(this.tweens[i], now)) {
                this.tweens.splice(i, 1);
            }
        }
        if (this.tweens.length === 0) {
            this.stopLoop();
        }
    }

    private static updateOne(t: TweenState, now: number): boolean {
        if (!t.label || t.label.destroyed) return true;

        let pct = Math.min((now - t.startTime) / t.duration, 1);
        pct = applyEase(pct, t.ease);

        const val = t.from + (t.to - t.from) * pct;
        t.label.text = t.format(val);
        t.onUpdate?.(val);

        // 缩放弹跳：中间放大，末尾回弹
        if (t.scaleEffect) {
            const scale = pct < 0.5
                ? 1 + pct * 0.4          // 前半段 1 → 1.2
                : 1 + (1 - pct) * 0.4;   // 后半段 1.2 → 1
            t.label.scaleX = t.startScaleX * scale;
            t.label.scaleY = t.startScaleY * scale;
        }

        if (pct >= 1) {
            t.label.text = t.format(t.to);
            if (t.scaleEffect) {
                t.label.scaleX = t.startScaleX;
                t.label.scaleY = t.startScaleY;
            }
            t.onComplete?.();
            return true;
        }
        return false;
    }
}

function applyEase(t: number, type: EaseType): number {
    switch (type) {
        case EaseType.Linear:
            return t;
        case EaseType.EaseIn:
            return t * t;
        case EaseType.EaseOut:
            return t * (2 - t);
        case EaseType.EaseInOut:
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
            return t;
    }
}
