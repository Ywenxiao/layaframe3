export interface IAppAdapter {

    getItem?(key: string): string;

    setItem?(key: string, value: string): void;

    on(cmd: "show" | "hide", callback: (res?: any) => void): void

}