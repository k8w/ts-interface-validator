import ValidatorManager from '../src/ValidatorManager';
import InterfaceValidator from "../src/validators/InterfaceValidator";
import LogicValidator from "../src/validators/LogicValidator";
import ArrayValidator from "../src/validators/ArrayValidator";
import BasicValidator from "../src/validators/BasicValidator";
import * as assert from 'assert';
import * as path from 'path';
import { ValidateErrorCode } from '../src/models/ValidateResult';

describe('ValidatorManager', function () {
    let manager = new ValidatorManager();

    it('get interface validator', function () {
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

    it('get type validator', function () {
        let validator = manager.getValidator('Req', path.resolve(__dirname, 'res/protocol/Alternative.ts'));

        let result = validator.validate({
            symbolId: 'xxx',
            value: 'yes'
        })
        console.log(result)
        assert.equal(result.errcode, 0, `${result.originalError.fieldName}: ${result.originalError.message}`)

        result = validator.validate({
            symbolCode: 'xxx',
            value: 'no'
        })
        assert.equal(result.errcode, 0, `${result.originalError.fieldName}: ${result.originalError.message}`)

        result = validator.validate({
            symbolId: 'xxx',
            symbolCode: 'xxx',
            value: 'yes'
        })
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse, `${result.originalError.fieldName}: ${result.originalError.message}`)
        
        result = validator.validate({
            value: 'yes'
        })
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse, `${result.originalError.fieldName}: ${result.originalError.message}`)
    })

    describe('get validator by typeDef', function () {
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

    it('Partial Type', function () {
        let validator = manager.getValidator('Partial<PartTest>', path.resolve(__dirname, 'res/protocol/PartTest.ts'));

        let result = validator.validate({});
        assert.equal(result.errcode, 0);

        result = validator.validate({
            a: 'sss'
        });
        assert.equal(result.errcode, 0);

        result = validator.validate({
            b: 666
        });
        assert.equal(result.errcode, 0);

        result = validator.validate({
            a: 666
        });
        assert.equal(result.errcode, ValidateErrorCode.InterfaceNotMatch);
        assert.equal(result.fieldName, 'a');
        assert.equal(result.innerError!.errcode, ValidateErrorCode.NotString);

        result = validator.validate({
            b: '666'
        });
        assert.equal(result.errcode, ValidateErrorCode.InterfaceNotMatch);
        assert.equal(result.fieldName, 'b');
        assert.equal(result.innerError!.errcode, ValidateErrorCode.NotNumber);
    })

    it('Referenced cache', function () {
        let validator1 = manager.getValidator('PartTest', path.resolve(__dirname, 'res/protocol/PartTest.ts'));
        let validator2 = manager.getValidator('PartTest', path.resolve(__dirname, 'res/protocol/PartTest.ts'));
        assert.deepEqual(validator1, validator2);
    })
});