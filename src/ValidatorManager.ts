import IValidator from './validators/IValidator';
import InterfaceValidator from './validators/InterfaceValidator';
import LogicValidator from "./validators/LogicValidator";
import ArrayValidator from "./validators/ArrayValidator";
import BasicValidator from "./validators/BasicValidator";
import ValidatorUtil from './validators/ValidatorUtil';
import Util from "./models/Util";
import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

export default class ValidatorManager {
    readonly strictNullChecks: boolean;  //default is true
    private _referencedValidatorCache: { [key: string]: IValidator } = {};

    private static _instance: ValidatorManager;
    static get instance(): ValidatorManager {
        if (!this._instance) {
            this._instance = new ValidatorManager();
        }
        return this._instance;
    }

    constructor(strictNullChecks: boolean = true) {
        this.strictNullChecks = strictNullChecks;
    }

    /**
     * Get a validator
     * Support both from file or individual type definition
     * @param type Type definition or type/interface name
     * @param fileName Which file the type is defined in, needed referenced any other type
     */
    getValidator(type: string, fileName?: string): IValidator {
        type = ValidatorUtil.trimBrackets(type.trim());

        //Cached referenced validator
        if (fileName && this._referencedValidatorCache[type + fileName]) {
            return this._referencedValidatorCache[type + fileName];
        }

        //remove comments
        type = ValidatorUtil.removeComment(type.trim());

        if (!type) {
            throw new Error('No available type: ' + type);
        }

        // 1. LogicValidator
        if (this.isLogicType(type)) {
            return new LogicValidator(type, this, fileName)
        }

        // 2. ArrayValidator
        if (this.isArrayType(type)) {
            return new ArrayValidator(type, this, fileName);
        }

        // 3. BasicValidator
        if (this.isBasicType(type)) {
            return new BasicValidator(type);
        }

        // 4. PartialValidator
        if (this.isPartialType(type)) {
            let partialBody = type.match(/^Partial\<(\w+)\>$/)![1];
            let validator = this.getValidator(partialBody, fileName);
            if (!(validator instanceof InterfaceValidator)) {
                throw new Error(`Partial type is only support interface: ${partialBody}`)
            }
            validator.fieldValidators.forEach(v => {
                v.isRequired = false;
            })
            return validator;
        }

        // 5. InterfaceValidator
        if (this.isInterfaceType(type)) {
            return new InterfaceValidator(type, this, fileName);
        }

        // 6. Referenced type (type is name of type/interface)
        if (!fileName) {
            throw new Error(`Type "${type}" is a referenced type, but no fileName is assigned.`);
        }
        let validator = this.getReferencedTypeValidator(type, fileName);
        //Cache referenced type (at the top)
        this._referencedValidatorCache[type + fileName] = validator;
        return validator;
    }

    /**
     * Get validator from referenced type.
     * Referenced type means type not defined directly, but refered to name of other type (in the same file or not)
     * @param typeName Name of referenced type
     * @param fileName Which file this type is referenced at
     * @param fileContent Pass this to save cost of reading file
     */
    private getReferencedTypeValidator(typeName: string, fileName: string, fileContent?: string): IValidator {
        let realFileName = this.getReferencedTypePath(typeName, fileName, fileContent);

        //是import的（定义不在本文件），fileContent也得重新取
        if (realFileName !== fileName || !fileContent) {
            fileContent = this.getCleanFileContent(realFileName);
        }

        // Is type
        let typeDef = this.getTypeDefFromFileContent(typeName, fileContent);
        if (typeDef) {
            return this.getValidator(typeDef, realFileName);
        }

        // Is interface
        let interfaceDef = this.getInterfaceDefFromFileContent(typeName, fileContent);
        if (interfaceDef) {
            return this.getValidator(interfaceDef, realFileName);
        }

        throw new Error(`Cannot find interface or type definition of "${typeName}" at ${realFileName}`);
    }

    /**
     * Get path of a type referenced in a file
     * Return fileName must be exists (validated)
     * @param fileName Full pathname of file to resolve
     * @param typeName Name of referenced type
     * @param fileContent Pass this to save cost of reading file
     */
    private getReferencedTypePath(typeName: string, fileName: string, fileContent?: string): string {
        let importDefs = this.getImportDefs(fileName, fileContent);
        let matches;
        for (let def of importDefs) {
            // Get the first match
            if (matches = def.match(new RegExp(`\\b${typeName}\\b[\\s\\S]+\\bfrom\\s+['"](.+?)['"]$`))) {
                break;
            }
        }

        if (matches) {
            // Convert to absolute path
            fileName = path.resolve(
                path.dirname(fileName),
                matches[1]
            );

            if (fs.existsSync(fileName)) {
                // Do nothing
            }
            else if (fs.existsSync(fileName + '.ts')) {
                fileName += '.ts';
            }
            else if (fs.existsSync(fileName + '.tsx')) {
                fileName += '.tsx';
            }
            else if (fs.existsSync(fileName + '.d.ts')) {
                fileName += '.d.ts';
            }
            else {
                throw new Error('Import from non-existing file: ' + fileName);
            }

            // Is from import
            return fileName;
        }
        else {
            // Not from import, but from itself
            return fileName;
        }
    }

    private getTypeDefFromFileContent(typeName: string, fileContent: string): string | null {
        let typeReg = new RegExp(`\\btype\\s+${Util.escapeForRegExp(typeName)}\\s+=`);
        let match = fileContent.match(typeReg);
        if (match) {
            // 从定义开始往下找
            let startPos = match.index! + match[0].length;
            let lastOutEndPos: number = NaN;
            //当前的状态：在外部，在外部（等待下一个逻辑），在内部（字符串），在内部（花括号），在内部（括号）
            let curType: 'out' | 'logicWait' | 'inString' | 'inBrace' | 'inBracket' = 'out';
            let braceOrBracketLevel = 0; //括号层级
            let isWaitingLogic = false;

            let out = (pos: number) => {
                isWaitingLogic = false;
                lastOutEndPos = pos;
                curType = 'out';
            }

            //只要没break 就查找到文件尾
            for (let curPos = startPos; curPos < fileContent.length; ++curPos) {
                let char = fileContent[curPos];

                /**
                 *  |-在外部
                        |- 空白跳过
                        |- 尚未out过 || isWaitingLogic
                            |- 等待开始：等待字符串、引号、花括号、括号
                            |- 其余异常
                        |- else = 已经out过 && !isWaitingLogic
                            |- 等待 & |
                                |- 设置isWaitingLogic=true
                            |- 其余RETURN
                    |- 在字符串内部
                        |- 空白 分号 & | OUT(curPos-1)
                    |- 在花括号、括号内部
                        |- 遇到相应括号，递减level，若level为0则OUT
                 */

                // 在外部
                if (curType == 'out') {
                    // 空白跳过
                    if (/\s/.test(char)) {
                        //continue
                    }
                    // 尚未out过 || isWaitingLogic
                    else if (isNaN(lastOutEndPos) || isWaitingLogic) {
                        // 等待开始：等待字符串、引号、花括号、括号
                        if (/\w|\'|\"/.test(char)) {
                            curType = 'inString';
                        }
                        else if (char == '{') {
                            curType = 'inBrace';
                            braceOrBracketLevel = 1;
                        }
                        else if (char == '(') {
                            curType = 'inBracket';
                            braceOrBracketLevel = 1;
                        }
                        // 其余异常
                        else {
                            throw new Error(`Unexpected charactor "${char}" at the type beginning (index=${curPos})`);
                        }
                    }
                    // else = 已经out过 && !isWaitingLogic
                    else {
                        // 等待 & |
                        if (/\&|\|/.test(char)) {
                            isWaitingLogic = true;
                        }
                        // 其余RETURN
                        else {
                            return fileContent.substr(startPos, lastOutEndPos - startPos + 1).trim();
                        }
                    }
                }
                // 在字符串内部
                else if (curType == 'inString') {
                    // 空白 分号 & | OUT
                    if (/\s|;|\&|\|/.test(char)) {
                        out(curPos - 1);
                        if (char == '&' || char == '|') {
                            isWaitingLogic = true;
                        }
                    }
                }
                // 在花括号内部    
                else if (curType == 'inBrace') {
                    // 遇到}，递减level，若level为0则OUT
                    if (char == '}') {
                        --braceOrBracketLevel;
                        if (braceOrBracketLevel == 0) {
                            out(curPos)
                        }
                    }
                }
                else if (curType == 'inBracket') {
                    // 遇到), level-- 
                    if (char == ')') {
                        --braceOrBracketLevel;
                        // 若level == 0, out
                        if (braceOrBracketLevel == 0) {
                            out(curPos)
                        }
                    }
                }
            }

            //可能直到文件尾也没有结束符
            if (!isNaN(lastOutEndPos) && curType == 'out') {
                return fileContent.substr(startPos, lastOutEndPos - startPos + 1).trim();
            }
            else {
                throw new Error(`Invalid type definition: ${typeName}`);
            }
        }
        else {
            // Type not found
            // throw new Error(`Type not found: ${typeName}`);
            return null;
        }
    }

    private getInterfaceDefFromFileContent(typeName: string, fileContent: string): string | null {
        let interfaceReg = new RegExp(`\\binterface\\s+${Util.escapeForRegExp(typeName)}(\\s+extends\\s+\\w+)?.*\\{`);
        let match = fileContent.match(interfaceReg);

        if (match) {
            let startPos = match.index! + match[0].length;
            let braceLevel = 1;
            for (let curPos = startPos; curPos < fileContent.length; ++curPos) {
                let char = fileContent[curPos];
                if (char == '{') {
                    ++braceLevel;
                }
                else if (char == '}') {
                    if (--braceLevel == 0) {
                        return fileContent.substr(match.index!, curPos - match.index! + 1);
                    }
                }
            }
            throw new Error('Brace not match in interface definition');
        }
        else {
            //not interface
            return null;
        }
    }

    /**
     * Get import definition of a file.
     * Every import would be a element of returned array.
     * @param fileName Full pathname
     * @param fileContent Pass this to save the cost of reading file.
     */
    private getImportDefs(fileName: string, fileContent?: string): string[] {
        if (!fileContent) {
            fileContent = this.getCleanFileContent(fileName);
        }
        let matches = fileContent.match(/import\b[\s\S]+?\bfrom\s+[\'\"].+[\'\"]/g);
        return matches ? matches.map(v => v.replace(/\s+/g, ' ')) : [];
    }

    /**
     * Return file content without comment
     * @param fileName 
     */
    private getCleanFileContent(fileName: string) {
        let fileContent = fs.readFileSync(fileName).toString();
        return ValidatorUtil.removeComment(fileContent);
    }

    private isLogicType(typeDef: string): boolean {
        let bracketLevel = 0, braceLevel = 0, anglebracketLevel = 0;
        let isLogicType = false;
        for (let pos = 0; pos < typeDef.length && !isLogicType; ++pos) {
            switch (typeDef[pos]) {
                case '|':
                case '&':
                    //证明有逻辑运算符 则归类为LogicValidator
                    bracketLevel == 0 && braceLevel == 0 && anglebracketLevel == 0 && (isLogicType = true);
                    break;
                case '(':
                    ++bracketLevel;
                    break;
                case ')':
                    --bracketLevel;
                    break;
                case '{':
                    ++braceLevel;
                    break;
                case '}':
                    --braceLevel;
                    break;
                case '<':
                    ++anglebracketLevel;
                    break;
                case '>':
                    --anglebracketLevel;
                    break;
            }
        }

        if (!isLogicType) {
            assert.equal(bracketLevel, 0);
            assert.equal(braceLevel, 0);
        }

        return isLogicType;
    }

    private isArrayType(typeDef: string): boolean {
        return /^([\s\S]*)\[\]$/.test(typeDef) || /^Array\<([\s\S]*)\>$/.test(typeDef);
    }

    private isBasicType(typeDef: string): boolean {
        return /^(number|string|boolean|[Oo]bject|any|null|undefined)$/.test(typeDef)     //基础类型
            || /^'.*'$/.test(typeDef)     //静态字符串
            || /^".*"$/.test(typeDef);     //静态字符串
    }

    private isPartialType(typeDef: string): boolean {
        return /^Partial\<\w+\>$/.test(typeDef);
    }

    private isInterfaceType(typeDef: string): boolean {
        return /^(interface\s+\w+(\s+extends\s+\w+)?\s*)?\{[\s\S]*\}$/.test(typeDef);
    }
}