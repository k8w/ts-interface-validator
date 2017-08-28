import IValidator from "./validators/IValidator";
import InterfaceValidator from "./validators/InterfaceValidator";
import LogicValidator from "./validators/LogicValidator";
import ArrayValidator from "./validators/ArrayValidator";
import BasicValidator from "./validators/BasicValidator";
import ValidatorUtil from "./validators/ValidatorUtil";
import Util from "./models/Util";

const fs = require('fs');
const path = require('path');
const assert = require('assert');

export default class ValidatorManager {

    private static _instance: ValidatorManager;
    static get instance(): ValidatorManager {
        if (!this._instance) {
            this._instance = new ValidatorManager();
        }
        return this._instance;
    }

    /**
     * 根据类型定义选择相应的Validator
     * 一共有四种类型，判断顺序为 LogicValidator > ArrayValidator > BasicValidator > InterfaceValidator
     * @param typedef 类型定义，不包含字段名。例如对于 `field: string`, `typedef` 为 `string`。
     * @param parent
     * @returns {TestValidator}
     */
    getTypeValidator(typedef: string, parent: InterfaceValidator): IValidator {
        typedef = ValidatorUtil.trimBrackets(typedef.trim());

        // 1. LogicValidator
        if (this.isLogicType(typedef)) {
            return new LogicValidator(typedef, parent)
        }

        // 2. ArrayValidator
        if (this.isArrayType(typedef)) {
            return new ArrayValidator(typedef, parent);
        }

        // 3. BasicValidator
        if (this.isBasicType(typedef)) {
            return new BasicValidator(typedef);
        }

        // 4. PartialValidator
        if (this.isPartialType(typedef)) {
            let interfaceName = typedef.match(/^Partial\<(\w+)\>$/)![1];
            let validator = this.getInterfaceValidator(this.getReferencedTypePath(interfaceName, parent), interfaceName);
            validator.fieldValidators.forEach(v => {
                v.isRequired = false;
            })
            return validator;
        }

        // 5. InterfaceValidator
        if (/^\{[\s\S]*\}$/.test(typedef)) {
            return new InterfaceValidator(typedef, {
                filename: parent.filename,
                strictNullChecks: parent.strictNullChecks
            });
        }
        else {
            return this.getInterfaceValidator(this.getReferencedTypePath(typedef, parent), typedef);
        }
    }

    private regedValidators: { [index: string]: InterfaceValidator } = {};
    getInterfaceValidator(filename: string, name: string, strictNullChecks: boolean = false): InterfaceValidator {
        let regKey = filename + '@' + name;
        //先从缓存内查找
        if (this.regedValidators[regKey]) {
            return this.regedValidators[regKey];
        }

        //缓存中找不到 去文件里找
        if (!fs.existsSync(filename)) {
            throw new Error('没有这个文件: ' + filename);
        }
        let fileContent = fs.readFileSync(filename).toString();

        let startReg = new RegExp(`\\binterface\\s+${Util.escapeForRegExp(name)}(\\s+extends\\s+\\w+)?.*\\{`);
        let match = fileContent.match(startReg);
        if (match == null) {
            throw new Error(`找不到${name}的类型定义在${filename}`);
        }

        //检查是否存在继承
        let extendsTypeName: string | undefined;
        if (match[1]) {
            //继承的类型
            extendsTypeName = match[1].trim().substr(7).trim();
        }

        let curPos = match.index;
        let bracketsLevel = 0; //目前进入的花括号层级，0代表目前不在花括号内

        //import def
        let matches = fileContent.match(/import .*;/g);
        let importDef = matches ? matches.join('\n') : '';

        //结果
        let startPos = -1, endPos = -1;

        //词法分析
        while (!(startPos > -1 && bracketsLevel == 0)) {  //只要还没结束
            if (fileContent[curPos] == '{') {
                ++bracketsLevel;
                if (startPos == -1) {
                    //入口点
                    startPos = curPos;
                }
            }
            else if (fileContent[curPos] == '}') {
                if (startPos == -1 || bracketsLevel < 1) {
                    throw new Error('类型定义错误，括号不匹配');
                }

                if (--bracketsLevel == 0) {
                    //结束
                    endPos = curPos;
                    break;
                }
            }

            //到头了
            if (++curPos == fileContent.length) {
                break;
            }
        }

        if (startPos == -1 || endPos == -1) {
            throw new Error(`在${filename}中解析${name}失败`);
        }

        let typedef = fileContent.substr(startPos, endPos - startPos + 1);
        let validator = new InterfaceValidator(typedef, {
            name: name,
            filename: filename,
            importDef: importDef,
            strictNullChecks: strictNullChecks,
            extendsTypeName: extendsTypeName
        });

        if (!validator) {
            throw new Error('Validator创建失败')
        }

        this.regedValidators[regKey] = validator;
        return validator;
    }

    /**
     * 获取在一个文件中引用的Type的路径
     * @param typeName 被引用的Type名
     * @param parent 引用该Type的Interface的Validator
     */
    getReferencedTypePath(typeName: string, parent: InterfaceValidator): string {
        let matches = parent.importDef.match(new RegExp(`import.*\\b${typeName}\\b.*\\bfrom\\b.*['"]([\\w\\.\\_\\/\\\\]+)['"]`));
        if (matches) {
            let filename = path.resolve(
                path.dirname(parent.filename),
                matches[1]
            );

            if (fs.existsSync(filename)) {
                //nop
            }
            else if (fs.existsSync(filename + '.ts')) {
                filename += '.ts';
            }
            else if (fs.existsSync(filename + '.tsx')) {
                filename += '.tsx';
            }
            else if (fs.existsSync(filename + '.d.ts')) {
                filename += '.d.ts';
            }
            else {
                throw new Error('文件不存在：' + filename);
            }

            //是import的
            return filename;
        }
        else {
            //不是import的 在当前文件查找
            return parent.filename;
        }
    }

    private isLogicType(typedef: string): boolean {
        let bracketsLevel = 0, braceLevel = 0, angleBracketsLevel = 0;
        let isLogicType = false;
        for (let pos = 0; pos < typedef.length && !isLogicType; ++pos) {
            switch (typedef[pos]) {
                case '|':
                case '&':
                    //证明有逻辑运算符 则归类为LogicValidator
                    bracketsLevel == 0 && braceLevel == 0 && angleBracketsLevel == 0 && (isLogicType = true);
                    break;
                case '(':
                    ++bracketsLevel;
                    break;
                case ')':
                    --bracketsLevel;
                    break;
                case '{':
                    ++braceLevel;
                    break;
                case '}':
                    --braceLevel;
                    break;
                case '<':
                    ++angleBracketsLevel;
                    break;
                case '>':
                    --angleBracketsLevel;
                    break;
            }
        }

        if (!isLogicType) {
            assert.equal(bracketsLevel, 0);
            assert.equal(braceLevel, 0);
        }

        return isLogicType;
    }

    private isArrayType(typedef: string): boolean {
        return /^([\s\S]*)\[\]$/.test(typedef) || /^Array\<([\s\S]*)\>$/.test(typedef);
    }

    private isBasicType(typedef: string): boolean {
        return /^(number|string|boolean|[Oo]bject|any|null|undefined)$/.test(typedef)     //基础类型
            || /^'.*'$/.test(typedef)     //静态字符串
            || /^".*"$/.test(typedef);     //静态字符串
    }

    private isPartialType(typedef: string): boolean {
        return /^Partial\<\w+\>$/.test(typedef);
    }
}