import { INJECT } from "./Context";
import { ContextType } from "./DefineTypes";

// ============================================================
// HTTP 请求封装 — 基于 Laya.HttpRequest，提供 Axios 风格的 Promise API
// ============================================================

/** HTTP 方法（受 Laya.HttpRequest.send 签名限制，仅支持这三种） */
type HttpMethod = 'get' | 'post' | 'head';

/** 响应数据类型 */
type HttpResponseType = 'json' | 'text' | 'arraybuffer';

/** 默认全局配置 */
interface HttpConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    responseType?: HttpResponseType;
}

/** 单次请求配置 */
interface HttpRequestConfig {
    url?: string;
    method?: HttpMethod;
    baseURL?: string;
    /** 毫秒。显式传 0 表示不限制超时 */
    timeout?: number;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean>;
    data?: any;
    responseType?: HttpResponseType;
}

/** 统一响应结构 */
interface HttpResponse<T = any> {
    data: T;
    status: number;
    /**
     * 响应头，头名统一归一为小写。
     * 注意：跨域时只能读到 CORS 安全名单内的头，其余需服务端用
     * Access-Control-Expose-Headers 显式暴露，否则这里读不到。
     */
    headers: Record<string, string>;
    config: HttpRequestConfig;
}

/** 拦截器函数类型 */
type InterceptorFn<T> = (value: T) => T | Promise<T>;

/** 拦截器对象 */
interface Interceptor<T> {
    fulfilled: InterceptorFn<T>;
    rejected?: InterceptorFn<any>;
}

// ============================================================
// 请求错误
// ============================================================
/** 携带 status / 响应体的请求错误，便于在响应拦截器里做全局错误处理 */
class HttpError<T = any> extends Error {
    constructor(
        message: string,
        readonly config: HttpRequestConfig,
        readonly status: number = 0,
        readonly response?: HttpResponse<T>,
        readonly isTimeout: boolean = false,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

// ============================================================
// 拦截器管理器
// ============================================================
class InterceptorManager<T> {
    private interceptors: (Interceptor<T> | null)[] = [];

    /** 注册拦截器，返回 id（数组索引）用于移除 */
    use(fulfilled: InterceptorFn<T>, rejected?: InterceptorFn<any>): number {
        this.interceptors.push({ fulfilled, rejected });
        return this.interceptors.length - 1;
    }

    /** 移除拦截器（置空，不删除以保持索引稳定） */
    eject(id: number): void {
        if (id >= 0 && id < this.interceptors.length) {
            this.interceptors[id] = null;
        }
    }

    /** 遍历执行所有拦截器，跳过已移除的 */
    forEach(fn: (interceptor: Interceptor<T>) => void): void {
        for (let i = 0; i < this.interceptors.length; i++) {
            const interceptor = this.interceptors[i];
            if (interceptor !== null) {
                fn(interceptor);
            }
        }
    }
}

// ============================================================
// 核心 Http 类
// ============================================================
@INJECT(ContextType.SYSTEM, false)
class HttpRequest {
    /** 绝对地址（含协议相对地址 //host/path），命中时不拼 baseURL */
    private static readonly ABSOLUTE_URL = /^([a-z][a-z\d+\-.]*:)?\/\//i;

    /**
     * 全局默认配置。可直接改（http.defaults.baseURL = '...'），
     * 或用 setDefaults 批量合并。
     * 注意：本类由 @INJECT 以无参方式实例化，构造参数走不通，只能用这两种方式配置。
     */
    readonly defaults: HttpConfig = {
        baseURL: '',
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json',
    };

    /** 拦截器 */
    readonly interceptors = {
        request: new InterceptorManager<HttpRequestConfig>(),
        response: new InterceptorManager<HttpResponse>(),
    };

    constructor(config?: HttpConfig) {
        if (config) this.setDefaults(config);
    }

    /** 合并全局默认配置，headers 为浅合并 */
    setDefaults(config: HttpConfig): void {
        const headers = { ...this.defaults.headers, ...config.headers };
        Object.assign(this.defaults, config, { headers });
    }

    // ---- 便捷方法 ----

    get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>({ ...config, method: 'get', url });
    }

    post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>({ ...config, method: 'post', url, data });
    }

    head<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>({ ...config, method: 'head', url });
    }

    // ---- 核心请求方法 ----

    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
        // 合并默认配置与请求配置
        const merged: HttpRequestConfig = {
            ...this.defaults,
            ...config,
            headers: { ...this.defaults.headers, ...config.headers },
        };

        // 默认的 Content-Type，用于下面判断「是否没人显式指定过」
        const defaultContentType = this.defaults.headers?.['Content-Type'];

        // 执行请求拦截器链
        return this.runRequestInterceptors(merged).then(finalConfig => {
            return new Promise<HttpResponse<T>>((resolve, reject) => {
                const xhr = new Laya.HttpRequest();
                const method = (finalConfig.method || 'get').toLowerCase() as HttpMethod;
                const url = this.buildUrl(finalConfig, method);
                const timeout = finalConfig.timeout ?? 10000;   // 显式 0 = 不限制
                const responseType = method === 'head'
                    ? 'text'                                     // HEAD 无 body，避免空串走 JSON 解析
                    : (finalConfig.responseType || 'json');

                let settled = false;
                let timeoutId: any = 0;

                const cleanup = () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = 0;
                    }
                    xhr.offAll();
                };

                /**
                 * 统一出口：成功和失败都必须经过响应拦截器链，
                 * 这样才能在拦截器里做「401 刷 token」「统一错误提示」这类全局处理。
                 */
                const settle = (outcome: Promise<HttpResponse<T>>) => {
                    if (settled) {
                        // 已结束，吞掉这个 promise，否则它没有 handler 会变成 unhandled rejection
                        outcome.catch(() => { /* ignore */ });
                        return;
                    }
                    settled = true;
                    cleanup();
                    this.runResponseInterceptors(outcome as any).then(resolve as any, reject);
                };

                const buildResponse = (status: number): HttpResponse<T> => ({
                    // 用公有 xhr.data 读响应体，不要用事件回调参数：
                    // Laya 派发的就是响应体本身，旧写法 (e.data ?? e) 会把
                    // { code, data, msg } 这类信封误拆成内层 data。
                    data: xhr.data,
                    status,
                    headers: this.parseHeaders(xhr),
                    config: finalConfig,
                });

                // 成功回调
                const onComplete = () => {
                    // Laya 仅在 status 为 200/204/0 时 complete；status 缺失时与引擎行为保持一致取 200
                    settle(Promise.resolve(buildResponse(xhr.http?.status ?? 200)));
                };

                // 错误回调（含非 2xx —— Laya 把 4xx/5xx 也派发到 ERROR）
                const onError = (e: any = {}) => {
                    const message = typeof e === 'string'
                        ? e
                        : (e?.message || `HTTP error: ${method.toUpperCase()} ${url}`);
                    const status: number = xhr.http?.status ?? 0;
                    // 非 2xx 时响应体依然可读，保留下来给业务判错（如 401 的 {"msg":"token expired"}）
                    settle(Promise.reject(
                        new HttpError(message, finalConfig, status, buildResponse(status)),
                    ));
                };

                // 超时处理：只用 JS 定时器，不设原生 XHR timeout。
                // 原生超时派发的是 timeout 事件，而 Laya 只监听 load/error/abort/progress，
                // 两套机制并存反而可能出现「无事件、Promise 悬挂」。
                if (timeout > 0) {
                    timeoutId = setTimeout(() => {
                        xhr.offAll();                                    // 先解绑，避免 abort 反过来触发 error
                        try { xhr.http?.abort?.(); } catch (err) { /* ignore */ }
                        settle(Promise.reject(new HttpError(
                            `HTTP timeout ${timeout}ms: ${method.toUpperCase()} ${url}`,
                            finalConfig, 0, undefined, true,
                        )));
                    }, timeout);
                }

                xhr.on(Laya.Event.COMPLETE, this, onComplete);
                xhr.on(Laya.Event.ERROR, this, onError);

                // ---- 请求体 ----
                let body: any = null;
                let isRawBody = false;
                if (method === 'post' && finalConfig.data != null) {
                    const d = finalConfig.data;
                    if (typeof d === 'string') {
                        body = d;
                    } else if (HttpRequest.isRawBody(d)) {
                        body = d;               // FormData / Blob / ArrayBuffer 等原样透传，不能 stringify
                        isRawBody = true;
                    } else {
                        body = JSON.stringify(d);
                    }
                }

                // ---- 请求头：Laya 要的是扁平 key-value 数组 ["k1","v1","k2","v2"] ----
                const headers: Record<string, string> = { ...finalConfig.headers };
                if (body == null || isRawBody) {
                    // 无 body 时带 application/json 会凭空触发 CORS 预检；
                    // raw body 的 Content-Type 应交给平台生成（multipart 需要 boundary）。
                    // 仅当值仍是默认值（没人显式指定过）时才清理，避免覆盖调用方/拦截器的意图。
                    for (const k of Object.keys(headers)) {
                        if (k.toLowerCase() === 'content-type' && headers[k] === defaultContentType) {
                            delete headers[k];
                        }
                    }
                }
                const headerList: string[] = [];
                for (const k of Object.keys(headers)) {
                    if (headers[k] != null) headerList.push(k, String(headers[k]));
                }

                xhr.send(url, body, method, responseType, headerList.length ? headerList : undefined);
            });
        });
    }

    /** 执行请求拦截器链（按注册顺序执行；注意 axios 是逆序，此处不同） */
    private runRequestInterceptors(config: HttpRequestConfig): Promise<HttpRequestConfig> {
        let p = Promise.resolve(config);
        this.interceptors.request.forEach(interceptor => {
            p = p.then(interceptor.fulfilled, interceptor.rejected) as Promise<HttpRequestConfig>;
        });
        return p;
    }

    /**
     * 执行响应拦截器链。
     * 传入 rejected 的 promise 时，错误会依次经过各拦截器的 rejected 分支，
     * 拦截器返回正常值即可「恢复」该错误。
     */
    private runResponseInterceptors(start: Promise<HttpResponse>): Promise<HttpResponse> {
        let p = start;
        this.interceptors.response.forEach(interceptor => {
            p = p.then(interceptor.fulfilled, interceptor.rejected) as Promise<HttpResponse>;
        });
        return p;
    }

    /** 解析响应头：头名归一为小写，值内含 ": " 也能正确切分 */
    private parseHeaders(xhr: Laya.HttpRequest): Record<string, string> {
        const out: Record<string, string> = {};
        const raw: string = xhr.http?.getAllResponseHeaders?.() || '';
        if (!raw) return out;

        const lines = raw.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const idx = lines[i].indexOf(':');
            if (idx > 0) {
                out[lines[i].slice(0, idx).trim().toLowerCase()] = lines[i].slice(idx + 1).trim();
            }
        }
        return out;
    }

    /** 构建完整 URL：绝对地址直接透传，否则拼 baseURL 并归一斜杠；仅 GET/HEAD 拼 query */
    private buildUrl(config: HttpRequestConfig, method: HttpMethod): string {
        const path = config.url || '';
        let url: string;

        if (!config.baseURL || HttpRequest.ABSOLUTE_URL.test(path)) {
            url = path;
        } else {
            const base = config.baseURL.replace(/\/+$/, '');
            url = path ? `${base}/${path.replace(/^\/+/, '')}` : base;
        }

        if (method === 'get' || method === 'head') {
            const params = config.params;
            if (params) {
                const qs = Object.keys(params)
                    .filter(k => params[k] != null)
                    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                    .join('&');
                if (qs) {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
                }
            }
        }
        return url;
    }

    /**
     * 判断 body 是否需要原样透传。
     * 小游戏 / Native Runtime 可能缺失部分构造器，故先判存在性再 instanceof。
     */
    private static isRawBody(d: any): boolean {
        if (typeof FormData !== 'undefined' && d instanceof FormData) return true;
        if (typeof Blob !== 'undefined' && d instanceof Blob) return true;
        if (typeof URLSearchParams !== 'undefined' && d instanceof URLSearchParams) return true;
        if (typeof ArrayBuffer !== 'undefined' && (d instanceof ArrayBuffer || ArrayBuffer.isView(d))) return true;
        return false;
    }
}

export { HttpRequest, HttpError, InterceptorManager };
export type { HttpConfig, HttpRequestConfig, HttpResponse, HttpMethod, HttpResponseType, InterceptorFn, Interceptor };
