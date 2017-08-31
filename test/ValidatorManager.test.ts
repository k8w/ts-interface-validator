import ValidatorManager from '../src/ValidatorManager';
import InterfaceValidator from "../src/validators/InterfaceValidator";
import LogicValidator from "../src/validators/LogicValidator";
import ArrayValidator from "../src/validators/ArrayValidator";
import BasicValidator from "../src/validators/BasicValidator";
const assert = require('assert');
const path = require('path');

describe('ValidatorManager', function () {
    let manager = new ValidatorManager();

    it('getInterfaceValidator', function () {
        let validator = manager.getValidator('ReqDemo', path.resolve(__dirname, 'res/protocol/PtlDemo.ts'));

        assert(validator, 'Validator返回为空');
        assert.equal((validator as any).fieldValidators.length, 7, 'FieldValidator长度错误');

        let fields = (validator as any).fieldValidators.map((v: any) => v.fieldName).join(',');
        assert.equal(fields, 'paramA,paramB,paramC,paramD,paramD1,paramE,paramF', '字段解析错误');

        let requireds = (validator as any).fieldValidators.map((v: any) => v.isRequired ? '1' : '0').join('');
        assert.equal(requireds, '1110000', 'Required解析错误');

        assert((validator as any).fieldValidators[0].validator instanceof BasicValidator);
        assert((validator as any).fieldValidators[1].validator instanceof BasicValidator);
        assert((validator as any).fieldValidators[2].validator instanceof LogicValidator);
        assert((validator as any).fieldValidators[3].validator instanceof InterfaceValidator);
        assert((validator as any).fieldValidators[4].validator instanceof ArrayValidator)
    });

    describe('getFieldValidator', function () {
        it('Logic', function () {
            //Logic
            let validator = manager.getValidator(' string | number');
            assert(validator instanceof LogicValidator);
            validator = manager.getValidator("'cms' | 'type'");
            assert(validator instanceof LogicValidator);
            validator = manager.getValidator('"Test" & number');
            assert(validator instanceof LogicValidator);
            validator = manager.getValidator("({a:string,b:number}&{c:number})|'none'");
            assert(validator instanceof LogicValidator);
        });

        it('Array', function () {
            //Array
            let validator = manager.getValidator('string[]');
            assert(validator instanceof ArrayValidator);
            validator = manager.getValidator('Array<number>');
            assert(validator instanceof ArrayValidator);
            validator = manager.getValidator("('value1'|'value2')[]");
            assert(validator instanceof ArrayValidator);
            validator = manager.getValidator("Array<'value1'|'value2'>");
            assert(validator instanceof ArrayValidator);
        });

        it('Basic', function () {
            //Basic
            let validator = manager.getValidator('string');
            assert(validator instanceof BasicValidator);
            validator = manager.getValidator('number');
            assert(validator instanceof BasicValidator);
            validator = manager.getValidator('any');
            assert(validator instanceof BasicValidator);
            validator = manager.getValidator('boolean');
            assert(validator instanceof BasicValidator);
            validator = manager.getValidator('Object');
            assert(validator instanceof BasicValidator);
            validator = manager.getValidator("'Test'");
            assert(validator instanceof BasicValidator);
        });

        it('Interface', function () {
            //Interface
            let validator = manager.getValidator("{a:string, b:number[],\n c:'a1'|'b1';d:{d1:string}}");
            assert(validator instanceof InterfaceValidator);
            assert((validator as InterfaceValidator).fieldValidators[0].validator instanceof BasicValidator);
            assert((validator as InterfaceValidator).fieldValidators[1].validator instanceof ArrayValidator);
            assert((validator as InterfaceValidator).fieldValidators[2].validator instanceof LogicValidator);
            assert((validator as InterfaceValidator).fieldValidators[3].validator instanceof InterfaceValidator);
            //验证子项 d 的Validator正确
            validator = (validator as InterfaceValidator).fieldValidators[3].validator;
            assert.equal((validator as InterfaceValidator).fieldValidators.length, 1);
            assert((validator as InterfaceValidator).fieldValidators[0].validator instanceof BasicValidator);
        })
    })
});