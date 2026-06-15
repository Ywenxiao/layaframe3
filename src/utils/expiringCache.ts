export default class expiringCache {
    private cache: Map<string, { value: any, expiryTime: number }> = new Map();

    constructor(private ttl: number) { } // ttl: time-to-live (过期时间，单位：毫秒)


    //重新设置过期时间
    setTtl(ttl: number) {
        this.ttl = ttl;
    }

    setTTlBuKey(key: string, ttl: number) {
        const value = this.cache.get(key);
        if (!value) return false;
        value.expiryTime = Date.now() + ttl;

        return true;
    }

    delTtl(key: string) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
            return true;
        }
        return false;
    }

    // 获取缓存结果，如果过期则重新调用方法
    get<T>(key: string, fetchFn: (...args: (number | string)[]) => T, args?: (number | string)[]): T {

        // 创建一个缓存键，考虑到参数
        const cacheKey = this.generateCacheKey(key, args);

        const cached = this.cache.get(cacheKey);

        // 如果缓存存在且未过期，直接返回缓存的值
        if (cached && cached.expiryTime > Date.now()) {
            return cached.value;
        }

        // 如果缓存不存在或者已经过期，重新调用方法
        const value = fetchFn(...(args || []));

        // 更新缓存，设置新的过期时间
        this.cache.set(cacheKey, {
            value,
            expiryTime: Date.now() + this.ttl, // 设置新的过期时间
        });

        return value;
    }

    // 生成缓存键，考虑 key 和传递的参数
    private generateCacheKey(key: string, args: any[]): string {
        if (!args) return key;
        return key + args.join();
    }
}