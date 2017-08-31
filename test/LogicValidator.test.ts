import {ValidateErrorCode} from "../src/models/ValidateResult";
import LogicValidator from "../src/validators/LogicValidator";
import InterfaceValidator from "../src/validators/InterfaceValidator";
import ValidatorManager from '../src/ValidatorManager';
const assert = require('assert');

describe('LogicValidator', function () {
    let manager = new ValidatorManager();

    it('splitStrByLogic', function(){
        assert.deepEqual(
            LogicValidator.splitStrByLogic('A|(B&C)&(D|E&F)|G'),
            ['A','|','(B&C)','&','(D|E&F)','|','G']
        );
        assert.deepEqual(
            LogicValidator.splitStrByLogic('string | TestA & TestB | number | null'),
            ['string','|','TestA','&','TestB','|','number','|','null']
        )
    });

    it('mergeLogicArray', function () {
        assert.deepEqual(
            LogicValidator.mergeLogicArray(['A','|','B','&','C','|','D']),
            ['A','|','B&C','|','D']
        );

        let typedef = 'A|B&(C|D)|E&(F|G&H)';
        let splited = LogicValidator.splitStrByLogic(typedef);
        LogicValidator.mergeLogicArray(splited);
        assert.deepEqual(splited, ['A','|','B&(C|D)','|','E&(F|G&H)'])
    });

    it('validate OR', function(){
        let validator = new LogicValidator("'Value1'| 'Value2' | 'Value3'", manager);
        assert.equal(validator.validate('Value1').errcode, 0);
        assert.equal(validator.validate('Value2').errcode, 0);
        assert.equal(validator.validate('Value3').errcode, 0);
        assert.equal(validator.validate('Value').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate(' Value1 ').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('Value1 ').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate(' Value1').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate([1,1,1,1]).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotString);
        let result = validator.validate('Value');
        assert.equal(result.innerError, null);
        assert.equal(result.fieldName, null);
    });

    it('validate AND', function(){
        let validator = new LogicValidator("{a:string} & {b:number} & {c:boolean}", manager);
        assert.equal(validator.validate({a:'1',b:1,c:true}).errcode, 0);

        let result = validator.validate({a:1,b:1,c:true});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NotString);
        assert.equal(result.originalError.fieldName, '<Condition0>.a');

        result = validator.validate({a:'1',c:true});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.originalError.fieldName, '<Condition1>.b');
    });

    it('validate AND+OR', function(){
        let validator = new LogicValidator("'A' | {a:string} & {b:number} | 'C'", manager);
        assert.equal(validator.validate('A').errcode, 0);
        assert.equal(validator.validate({a:'1',b:1}).errcode, 0);
        assert.equal(validator.validate('C').errcode, 0);

        let result = validator.validate(123);
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.LogicFalse);

        result = validator.validate({a:'1',b:'1'});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.LogicFalse);

        result = validator.validate({a:1,b:1});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.LogicFalse);
    });

    it('validate Complex', function(){
        let validator = new LogicValidator("'A' | {a:string} & ({b:number}|{b:boolean}) | 'C'", manager);
        assert.equal(validator.validate('A').errcode, 0);
        assert.equal(validator.validate({a:'1',b:1}).errcode, 0);
        assert.equal(validator.validate({a:'1',b:true}).errcode, 0);
        assert.equal(validator.validate('C').errcode, 0);

        let result = validator.validate({a:'1',b:'1'});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.LogicFalse);

        result = validator.validate({a:1,b:1});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.LogicFalse);

        result = validator.validate({a:'1'});
        assert.equal(result.errcode, ValidateErrorCode.LogicFalse);
        assert.equal(result.originalError.errcode, ValidateErrorCode.LogicFalse);
    })
});