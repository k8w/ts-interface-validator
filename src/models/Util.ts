export default class Util {
    /**
     * 转义字符串，使他们可用于创建正则表达式，以进行简单的字符串比对
     * @param str
     * @returns {string}
     */
    static escapeForRegExp(str:string): string{
        return str.replace(/([\*\.\?\+\$\^\[\]\(\)\{\}\|\\\/])/g, '\\$1');
    }
}