
type badgeType = any;

export class UIUtils {

    // 设置子节点状态
    static setChildState<T extends Laya.Sprite>(parent: Laya.Sprite, childName: string, param: Partial<T>, onSuccess?: (sp: T) => void): void {
        if (!parent || !param) return;

        let elm = parent.getChildByName(childName) as T;
        if (!elm) return;

        for (let key in param) {
            elm[key] = param[key];
        }

        onSuccess && onSuccess(elm);
    }


    /**
    * 添加点击事件
    * @param node 点击对象
    * @param func 回调
    * @param thisObj 回调对象
    * @param once 仅监听一次
    * @param data 回调参数
    * @param time 多次点击阻断，默认200
    * @param sound 音效 "btn" 默认按钮音效
    * @param effect 音效播放 默认true false/0没有按下效果 1有效果没缓动
    * @param stopPropagation 停止事件冒泡
    * @param scaleOffset 缩放偏移
    * 注：事件清理请使用offAll
    */
    // static addClick(node: Laya.Sprite, func: Function, thisObj?: any, data?: any[], once: boolean = false, time: number = 200, sound: string = "btn", effect: boolean | number = true, stopPropagation: boolean = false, scaleOffset: number = 0.2): void {
    //     let fun = once ? "once" : "on", clickTime = 0, params = [];
    //     // node = node instanceof Laya.Sprite ? node : node.displayObject;
    //     // 防止多次监听  list时可能会出现多次监听
    //     // Laya.Tween.clearAll(node);
    //     node.offAll(Laya.Event.CLICK);
    //     // node.offAll(Laya.Event.MOUSE_DOWN);
    //     // node.offAll(Laya.Event.MOUSE_UP);
    //     // 当需要传参时，修改回调参数
    //     if (data != null) {
    //         params.push(...data);
    //         // evtIdx = 1;
    //     }
    //     node[fun](Laya.Event.CLICK, thisObj, function (e: Laya.Event) {
    //         const now = Laya.Browser.now();
    //         // e.stopPropagation();
    //         if (now - clickTime < time) {
    //             return;
    //         }
    //         params.push(e);
    //         func && func.apply(thisObj, params);
    //         clickTime = now;
    //     });

    //     if (effect === false || effect === 0) return;

    //     const oldsx = node.scaleX, oldsy = node.scaleY;
    //     this.setPivot(node);

    //     // 点击动画
    //     let isTouch = false;
    //     const nextx = oldsx + (oldsx > 0 ? 1 : -1) * scaleOffset;
    //     const nexty = oldsy + (oldsy > 0 ? 1 : -1) * scaleOffset;

    //     node.on(Laya.Event.MOUSE_DOWN, thisObj, onDown);
    //     node.on(Laya.Event.MOUSE_UP, thisObj, onOut);
    //     node.on(Laya.Event.MOUSE_OUT, thisObj, onOut);

    //     function onDown(e: Laya.Event) {
    //         isTouch = true;
    //         stopPropagation && e.stopPropagation();
    //         if (effect === 1) {
    //             node.scale(nextx, nexty);
    //         } else {
    //             Laya.Tween.to(node, { scaleX: nextx, scaleY: nexty }, 100);
    //         }
    //     }

    //     function onOut(e: Laya.Event) {
    //         if (isTouch) {
    //             isTouch = false;
    //             stopPropagation && e.stopPropagation();
    //             if (effect === 1) {
    //                 node.scale(oldsx, oldsy);
    //             } else {
    //                 Laya.Tween.to(node, { scaleX: oldsx, scaleY: oldsy }, 100);
    //             }
    //         }
    //     }
    // }

    /**设置锚点居中 */
    static setPivot(node: Laya.Sprite) {
        if (!node) return;

        let x = 0.5, y = 0.5

        const oldsx = node.scaleX, oldsy = node.scaleY;
        if (node instanceof Laya.UIComponent) {
            if (isNaN(node.anchorX)) {
                node.anchorX = x;
                node.x += node.width * x * oldsx;
            }
            if (isNaN(node.anchorY)) {
                node.anchorY = y;
                node.y += node.height * y * oldsy;
            }
        }
        else if (node instanceof Laya.Sprite) {
            if (node.pivotX === 0) {
                node.pivotX = node.width * x * oldsx;
                node.x += node.width * x * oldsx;
            }

            if (node.pivotY === 0) {
                node.pivotY = node.height * y * oldsy;
                node.y += node.height * y * oldsy;
            }
        }
    }

    static formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        } else {
            return num.toString();
        }
    }

    static waitTime(time: number) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(null);
            }, time);
        });
    }

    //TODO
    static fillText(node: Laya.Sprite, str: string) {
        node.graphics.fillText(str, 0, 0, "20px Arial", "#00ff00", "center");
    }

    /**
    * 设置列表居中
    * @param list 列表
    * @param direction 方向true 水平 false 垂直
    * @param parent 相对于父级布局
    */
    static setListCenter(list: Laya.List, direction: boolean = true) {
        if (!list || !list.parent) return;

        let cell = list.getCell(0);
        if (!cell) return;


        let key = direction ? "width" : "height";
        let keyCount = direction ? "x" : "y";
        let space = direction ? list.spaceX : list.spaceY;


        const parent = list.parent as Laya.Sprite;
        if (!parent) return;

        list[key] = (cell[key] + space) * list.length - space;

        list[keyCount] = (parent[key] - list[key]) / 2;
    }


    /**
     * 居中均匀布局
     * @param parent 
     * @param childList 
     * @param space 间隔
     * @param direction 方向true 水平 false 垂直
     * @returns 
     */
    static layoutCenter(parent: Laya.Sprite, childList: Laya.Sprite[], space: number = 0, direction: boolean = true) {
        if (!parent || !childList || !childList.length) return;


        let key = direction ? "width" : "height";
        let keyCount = direction ? "x" : "y";

        let max = childList.reduce((pre, cur) => pre + cur[key] + space, 0) - space;
        let start = (parent[key] - max) / 2;

        for (let item of childList) {
            item[keyCount] = start;
            start += item[key] + space;
        }
    }


    /**
     * 是否在多边形范围内
     * @param px 检测点
     * @param py 
     * @param offsetx 初始坐标
     * @param offsety 
     * @param polygon 多边形
     * @returns 
     */
    static isPointInPolygonFlat(offsetx: number, offsety: number, px: number, py: number, polygon: number[]): boolean {
        const len = polygon.length;
        let inside = false;

        for (let i = 0, j = len - 2; i < len; j = i, i += 2) {
            const xi = polygon[i] + offsetx, yi = polygon[i + 1] + offsety;
            const xj = polygon[j] + offsetx, yj = polygon[j + 1] + offsety;

            const intersect =
                ((yi > py) !== (yj > py)) &&
                (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**设置红点 */
    static setBadge(sp: Laya.Sprite, active: boolean | number, pos?: { x: number, y: number }, reversal: boolean = false, size?: { x: number, y: number }) {

        let isNum = typeof active === "number";
        let badgeName = "__badge__";
        // let badge = UIUtils.getBadgeItemBySprite(sp, isNum);
        let badge = sp.getChildByName(badgeName) as badgeType;

        active = active || false;
        if (!active) {
            badge && badge.recover();
            return;
        }

        // let check = (isNum && !(badge instanceof badge_item_num)) || (!isNum && !(badge instanceof badge_item));
        // if (badge && check) {
        //     badge.recover();
        //     console.warn("不是目标红点");
        //     badge = null;
        // }

        // if (!badge) {
        //     badge = isNum ? badge_item_num.create() : badge_item.create();
        //     badge.name = "__badge__";
        //     sp.addChild(badge);
        // }

        // pos = pos || { x: 0, y: 0 };

        // if (isNum) {
        //     (badge as badge_item_num).show(active as number, size);
        // } else {
        //     (badge as badge_item).show(reversal, size);
        // }

        badge.pos(pos.x, pos.y);
        badge.visible = true;
    }
    
}