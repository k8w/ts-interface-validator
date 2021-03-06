export default class ValidatorUtil {
    /**
     * 移除注释
     * @param typeDef
     */
    static removeComment(typeDef: string): string {
        return typeDef
            .replace(/\/\*[\s\S]*?\*\//g, '') //去除 /*...*/ 形式的注释
            .replace(/\/\/.*/g, '')  //去除单行注释
            .replace(/\r/g, '').replace(/\s*\n+\s*/g, '\n')  //移除空行
            .replace(/[ \t]+/g, ' ') //缩短空白
            .trim()
    }

    /**
     * 去除头尾的()
     * 如对 ('value1'|'value2') 将变成 'value1'|'value2'
     * 但对 ('value1')|('value2')则不受影响
     * @param typeDef
     */
    static trimBrackets(typeDef: string): string {
        //只去除最外层的一个全局括号
        function trimOutsideBrackets(str: string) {
            if (str[0] != '(') {
                return str;
            }

            let bracketsLevel = 1;
            for (let pos = 1; pos < str.length - 1; ++pos) {
                if (str[pos] == '(') {
                    ++bracketsLevel;
                }
                else if (str[pos] == ')') {
                    --bracketsLevel;
                }

                //开头的第一个括号，没到结尾就结束了，表示没有全局包住的括号
                if (bracketsLevel == 0) {
                    return str;
                }
            }

            //直到最后，第一个括号也没出去，表示这是一个全局括号
            return str.substr(1, str.length - 2);
        }

        //递归去除最外层的括号 直到没有变化为止
        let prev = typeDef; //上一次的结果
        let next = trimOutsideBrackets(typeDef);    //下一次的结果
        while (prev != next) {
            prev = next;
            next = trimOutsideBrackets(next);
        }
        return next;
    }
}