import { INJECT, Injectable, WITHCONTEXT } from "./Context";
import { ContextType } from "./DefineTypes";

// ============================================================
// HTTP 请求封装 — 基于 Laya.HttpRequest，提供 Axios 风格的 Promise API
// ============================================================

/** HTTP 方法 */
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
    /** 默认配置 */
    private defaults: HttpConfig = {
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

    private constructor(config?: HttpConfig) {
        if (config) {
            this.defaults = { ...this.defaults, ...config };
        }
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
            params: config.params,
        };

        // 执行请求拦截器链
        return this.runRequestInterceptors(merged).then(finalConfig => {
            return new Promise<HttpResponse<T>>((resolve, reject) => {
                const xhr = new Laya.HttpRequest();
                const method = (finalConfig.method || 'get').toLowerCase() as HttpMethod;
                const url = this.buildUrl(finalConfig, method);
                const timeout = finalConfig.timeout || 10000;
                const responseType = finalConfig.responseType || 'json';
                let timedOut = false;
                let timeoutId: number = 0;
                xhr['_http'].timeout = timeout;

                // 超时处理
                if (timeout > 0) {
                    timeoutId = setTimeout(() => {
                        timedOut = true;
                        xhr.offAll();
                        try { xhr['_http']?.abort?.(); } catch (e) { /* ignore */ }
                        reject(new Error(`HTTP timeout: ${method.toUpperCase()} ${url}`));
                    }, timeout);
                }

                // 成功回调
                const onComplete = (e: any = {}) => {
                    if (timedOut) return;
                    clearTimeout(timeoutId);

                    const rawData: any = typeof e === 'string' ? e : (e.data ?? e);
                    const status = xhr['_http']?.status ?? 200;
                    const rawHeaders: Record<string, string> = {};
                    const rawHeaderStr = xhr['_http']?.getAllResponseHeaders?.() || '';
                    if (rawHeaderStr) {
                        rawHeaderStr.split(/\r?\n/).forEach((line: string) => {
                            const parts = line.split(': ');
                            if (parts.length === 2) rawHeaders[parts[0]] = parts[1];
                        });
                    }

                    const response: HttpResponse<T> = {
                        data: rawData,
                        status,
                        headers: rawHeaders,
                        config: finalConfig,
                    };

                    // 执行响应拦截器链
                    this.runResponseInterceptors(response).then(resolve).catch(reject);
                };

                // 错误回调
                const onError = (e: any = {}) => {
                    if (timedOut) return;
                    clearTimeout(timeoutId);
                    reject(new Error(typeof e === 'string' ? e : (e.message || `HTTP error: ${method.toUpperCase()} ${url}`)));
                };

                xhr.on(Laya.Event.COMPLETE, this, onComplete);
                xhr.on(Laya.Event.ERROR, this, onError);

                // 处理请求体
                let body: string = '';
                if (method === 'post') {
                    if (finalConfig.data != null) {
                        body = typeof finalConfig.data === 'string'
                            ? finalConfig.data
                            : JSON.stringify(finalConfig.data);
                    }
                }

                xhr.send(url, body, method, responseType,);
            });
        });
    }

    /** 执行请求拦截器链：将 config 依次通过每个拦截器 */
    private async runRequestInterceptors(config: HttpRequestConfig): Promise<HttpRequestConfig> {
        let result = config;
        this.interceptors.request.forEach(interceptor => {
            const original = interceptor;
            // 使用 Promise.resolve 包装保证链式执行
            result = Promise.resolve(result).then(original.fulfilled, original.rejected) as any;
        });
        return Promise.resolve(result);
    }

    /** 执行响应拦截器链：将 response 依次通过每个拦截器 */
    private async runResponseInterceptors(response: HttpResponse): Promise<HttpResponse> {
        let result: any = response;
        this.interceptors.response.forEach(interceptor => {
            const original = interceptor;
            result = Promise.resolve(result).then(original.fulfilled, original.rejected);
        });
        return result;
    }

    /** 构建完整 URL（拼接 baseURL + path，仅 GET/HEAD 拼 query params） */
    private buildUrl(config: HttpRequestConfig, method: string): string {
        let url = (config.baseURL || '') + (config.url || '');
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
}

export { HttpRequest, HttpConfig, HttpRequestConfig, HttpResponse, InterceptorManager };
export type { HttpMethod, HttpResponseType, InterceptorFn, Interceptor };
