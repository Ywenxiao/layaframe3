
export default class ArrayUtils {

    /**数组交集 */
    static getIntersectionFast<T>(list1: T[], list2: T[], getKey: (item: T) => string | number): T[] {
        const map = new Set<number | string>();
        for (let i = 0; i < list2.length; i++) {
            map.add(getKey(list2[i]));
        }

        const result: T[] = [];
        for (let i = 0; i < list1.length; i++) {
            const key = getKey(list1[i]);
            if (map.has(key)) {
                result.push(list1[i]);
            }
        }

        return result;
    }


    /**数组差集 */
    static getDiffFast<T>(list1: T[], list2: T[], getKey: (item: T) => string | number): T[] {
        const keys1 = new Set(list1.map(getKey));
        const keys2 = new Set(list2.map(getKey));

        const result: T[] = [];

        for (const item of list1) {
            if (!keys2.has(getKey(item))) {
                result.push(item);
            }
        }

        for (const item of list2) {
            if (!keys1.has(getKey(item))) {
                result.push(item);
            }
        }

        return result;
    }


    //数组打乱（洗牌）
    static shuffle<T>(res: T[], origie: boolean = false): T[] {

        // 拷贝一份，避免修改原数组
        const arr = origie ? res : res.slice();

        for (let i = arr.length - 1; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0; // 用 |0 代替 Math.floor 更快
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }


    /**
     * 将数组分割成多个指定长度的子数组
     * @param arr 原数组
     * @param size 子数组长度
     * @returns
     */
    static chunkArray<T>(arr: T[], size: number): T[][] {
        if (size <= 0) throw new Error("size must be > 0");
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    }

    static in_array_int(find: any, arr: Array<any>): boolean {
        if (!arr) return false;
        for (let i = 0; i < arr.length; ++i) {
            if (Number(arr[i]) == find) {
                return true;
            }
        }
        return false;
    }

}