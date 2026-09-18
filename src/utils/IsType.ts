// @ts-nocheck
export default class IsType {

    // check for null type
    static null = x => x === null;

    // check for undefined type
    static undefined = x => x === undefined;

    // check for nil type. Either null or undefined
    static nil = x => IsType.null(x) || IsType.undefined(x);

    // check for strings and string literal type. e.g: 's', "s", `str`, new String()
    static string = x => !IsType.nil(x) && (typeof x === 'string' || x instanceof String);

    // check for number or number literal type. e.g: 12, 30.5, new Number()
    static number = x => !IsType.nil(x)
        && (// NaN & Infinity have typeof "number" and this excludes that
            (!isNaN(x) && isFinite(x)
                && typeof x === 'number'
            ) || x instanceof Number);

    // check for boolean or boolean literal type. e.g: true, false, new Boolean()
    static boolean = x => !IsType.nil(x) && (typeof x === 'boolean' || x instanceof Boolean);

    // check for array type
    static array = x => !IsType.nil(x) && Array.isArray(x);

    // check for object or object literal type. e.g: {}, new Object(), Object.create(null)
    static object = x => ({}).toString.call(x) === '[object Object]';

    // check for provided type instance
    static type = (x, X) => !IsType.nil(x) && x instanceof X;

    // check for set type
    static set = x => IsType.type(x, Set);

    // check for map type
    static map = x => IsType.type(x, Map);

    // check for date type
    static date = x => IsType.type(x, Date);

    static function = x => typeof x === 'function';

    //是否是偶数
    static even = x => (x & 1) === 0

    //是否是奇数
    static odd = x => (x & 1) === 1

}