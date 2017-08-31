import InterfaceValidator from "./InterfaceValidator";
import ValidateResult from "../models/ValidateResult";
import IValidator from "./IValidator";
import { ValidateErrorCode } from "../models/ValidateResult";
import ValidatorManager from "../ValidatorManager";

export default class LogicValidator implements IValidator {
    readonly condition: 'AND' | 'OR';
    readonly childValidators: IValidator[];
    /**
     * 是否是形如 'Value1' | 'Value2' | 'Value3' 的字符串枚举形式
     */
    readonly isEnumString: boolean;

    private _interfaceFields: {
        [key: string]: null;
    } = {};

    constructor(typeDef: string, manager: ValidatorManager, fileName?: string) {
        let splited = LogicValidator.splitStrByLogic(typeDef);
        LogicValidator.mergeLogicArray(splited);

        //此时 一级逻辑运算只有 & 或者只有 |
        //判断逻辑条件
        let isAnd = splited.indexOf('&') > -1;
        let isOr = splited.indexOf('|') > -1;
        if ((isAnd && isOr) || (!isAnd && !isOr)) {
            throw new Error('生成逻辑条件错误，isAnd与isOr不可相同');
        }
        this.condition = isAnd ? 'AND' : 'OR';

        //生成子元素validator
        this.childValidators = splited.filter(v => v != '&' && v != '|')
            .map(v => manager.getValidator(v, fileName));

        //扩展allowedFields
        //先给自己生成一份全的
        this.childValidators.forEach(v => {
            if (v instanceof InterfaceValidator) {
                Object.assign(this._interfaceFields, v.fieldNames);
            }
            else if (v instanceof LogicValidator) {
                Object.assign(this._interfaceFields, v._interfaceFields);
            }
        });
        //再同步给interface validator和logic validator
        this._updateInterfaceFields(this._interfaceFields);

        //是否静态枚举字符串
        this.isEnumString = splited.filter(v => v != '|').every(v => /^'[^']*'$/.test(v) || /^"[^"]*"$/.test(v))
    }

    private _updateInterfaceFields(fields: object) {
        Object.assign(this._interfaceFields, fields);
        this.childValidators.forEach(v => {
            if (v instanceof InterfaceValidator) {
                Object.assign(v.fieldNames, this._interfaceFields);
            }
            else if (v instanceof LogicValidator) {
                v._updateInterfaceFields(this._interfaceFields);
            }
        });
    }

    validate(value: any): ValidateResult {
        if (this.isEnumString && typeof (value) != 'string') {
            return new ValidateResult(ValidateErrorCode.NotString);
        }

        for (let key in this.childValidators) {
            let result = this.childValidators[key].validate(value);

            //AND 一错即错
            if (this.condition == 'AND' && result.isError) {
                return new ValidateResult(ValidateErrorCode.LogicFalse, `<Condition${key}>`, result);
            }

            //OR 一对即对
            if (this.condition == 'OR' && result.isSuccess) {
                return ValidateResult.success;
            }
        }

        //AND 没错即对
        if (this.condition == 'AND') {
            return ValidateResult.success
        }

        //OR 全错即错
        if (this.condition == 'OR') {
            return this.isEnumString
                ? new ValidateResult(ValidateErrorCode.InvalidStrLiteral)
                : new ValidateResult(ValidateErrorCode.LogicFalse);
        }

        throw new Error('非法的condition, condition=' + this.condition);
    }

    /**
     * 将typeDef拆解为数组
     * 拆解出所有一级逻辑运算符与其两边的typeDef
     * 形如 A | B & C | D
     * @param typeDef
     * @returns {Array}
     */
    static splitStrByLogic(typeDef: string): string[] {
        //解析typeDef 生成fieldValidators
        let bracketsLevel = 0, braceLevel = 0;
        let startPos = 0;
        let output: string[] = [];
        for (let curPos = 0; curPos < typeDef.length; ++curPos) {
            switch (typeDef[curPos]) {
                case '{':
                    ++braceLevel;
                    break;
                case '}':
                    --braceLevel;
                    break;
                case '(':
                    ++bracketsLevel;
                    break;
                case ')':
                    --bracketsLevel;
                    break;
                case '|':
                case '&':
                    if (bracketsLevel == 0 && braceLevel == 0) {
                        output.push(typeDef.substr(startPos, curPos - startPos).trim());
                        output.push(typeDef[curPos]);
                        startPos = curPos + 1;
                    }
                    break;
            }
        }
        if (startPos < typeDef.length) {
            output.push(typeDef.substr(startPos).trim());
        }

        if (output.some(v => v == '' || v == null)) {
            throw new Error('格式错误')
        }

        return output;
    }

    /**
     * 【注意：这项操作会改变原数组！】
     * 将形如 A | B & C | D 的逻辑数组，
     * 按照 & 的优先级高于 | 的原则，合并为
     * A | (B&C) | D     *
     * @param arr
     */
    static mergeLogicArray(arr: string[]): string[] {
        if (arr.indexOf('&') > -1 && arr.indexOf('|') > -1) {
            for (let i = arr.length - 2; i > 0; --i) {
                if (arr[i] == '&') {
                    arr[i - 1] = arr[i - 1] + '&' + arr[i + 1];
                    arr.splice(i, 2);
                    --i;
                }
            }
        }

        return arr;
    }
}