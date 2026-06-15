export class TimeUtils {

    private static _date = new Date();

    static second = 1000;
    static minute = 60000;
    static hour = 360000;
    static day = 86400000;

    static formatDate(ms: number): string {
        const d = this._date;
        d.setTime(ms);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;

        // return TimeUtils.formatTime(ms, "YYYY-MM-DD");
    }

    /**日期格式化 */
    static formatTime(ms: number, format = "YYYY-MM-DD hh:mm:ss"): string {
        const d = this._date;
        d.setTime(ms);

        const Y = d.getFullYear();
        const M = (d.getMonth() + 1).toString().padStart(2, "0");
        const D = d.getDate().toString().padStart(2, "0");
        const h = d.getHours().toString().padStart(2, "0");
        const m = d.getMinutes().toString().padStart(2, "0");
        const s = d.getSeconds().toString().padStart(2, "0");

        return format.replace(/YYYY|MM|DD|hh|mm|ss/g, (k) => {
            switch (k) {
                case "YYYY": return Y + "";
                case "MM": return M;
                case "DD": return D;
                case "hh": return h;
                case "mm": return m;
                case "ss": return s;
                default: return "";
            }
        });
    }
}