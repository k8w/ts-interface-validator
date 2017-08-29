import ValidatorManager from "../src/ValidatorManager";
import InterfaceValidator from "../src/validators/InterfaceValidator";
import LogicValidator from "../src/validators/LogicValidator";
import ArrayValidator from "../src/validators/ArrayValidator";
import BasicValidator from "../src/validators/BasicValidator";
const assert = require('assert');
const path = require('path');

describe('ValidatorManager', function(){
    it('getInterfaceValidator', function(){
        let validator = ValidatorManager.instance.getInterfaceValidator(path.resolve(__dirname,'res/protocol/PtlDemo.ts'), 'ReqDemo');

        assert(validator, 'Validator返回为空');
        assert.equal(validator.fieldValidators.length, 7, 'FieldValidator长度错误');

        let fields = validator.fieldValidators.map(v=>v.fieldName).join(',');
        assert.equal(fields, 'paramA,paramB,paramC,paramD,paramD1,paramE,paramF', '字段解析错误');

        let requireds = validator.fieldValidators.map(v=>v.isRequired?'1':'0').join('');
        assert.equal(requireds, '1110000', 'Required解析错误');

        assert(validator.fieldValidators[0].validator instanceof BasicValidator);
        assert(validator.fieldValidators[1].validator instanceof BasicValidator);
        assert(validator.fieldValidators[2].validator instanceof LogicValidator);
        assert(validator.fieldValidators[3].validator instanceof InterfaceValidator);
        assert(validator.fieldValidators[4].validator instanceof ArrayValidator)
    });

    describe('getFieldValidator', function(){
        it('Logic', function(){
            let parent = new InterfaceValidator('{}');
            //Logic
            let validator = ValidatorManager.instance.getTypeValidator(' string | number',parent);
            assert(validator instanceof LogicValidator);
            validator = ValidatorManager.instance.getTypeValidator("'cms' | 'type'",parent);
            assert(validator instanceof LogicValidator);
            validator = ValidatorManager.instance.getTypeValidator('"Test" & number',parent);
            assert(validator instanceof LogicValidator);
            validator = ValidatorManager.instance.getTypeValidator("({a:string,b:number}&{c:number})|'none'",parent);
            assert(validator instanceof LogicValidator);
        });

        it('Array', function(){
            let parent = new InterfaceValidator('{}');
            //Array
            let validator = ValidatorManager.instance.getTypeValidator('string[]',parent);
            assert(validator instanceof ArrayValidator);
            validator = ValidatorManager.instance.getTypeValidator('Array<number>',parent);
            assert(validator instanceof ArrayValidator);
            validator = ValidatorManager.instance.getTypeValidator("('value1'|'value2')[]",parent);
            assert(validator instanceof ArrayValidator);
            validator = ValidatorManager.instance.getTypeValidator("Array<'value1'|'value2'>",parent);
            assert(validator instanceof ArrayValidator);
        });

        it('Basic', function(){
            let parent = new InterfaceValidator('{}');

            //Basic
            let validator = ValidatorManager.instance.getTypeValidator('string',parent);
            assert(validator instanceof BasicValidator);
            validator = ValidatorManager.instance.getTypeValidator('number',parent);
            assert(validator instanceof BasicValidator);
            validator = ValidatorManager.instance.getTypeValidator('any',parent);
            assert(validator instanceof BasicValidator);
            validator = ValidatorManager.instance.getTypeValidator('boolean',parent);
            assert(validator instanceof BasicValidator);
            validator = ValidatorManager.instance.getTypeValidator('Object',parent);
            assert(validator instanceof BasicValidator);
            validator = ValidatorManager.instance.getTypeValidator("'Test'",parent);
            assert(validator instanceof BasicValidator);
        });

        it('Interface', function(){
            let parent = new InterfaceValidator('{}');

            //Interface
            let validator = ValidatorManager.instance.getTypeValidator("{a:string, b:number[],\n c:'a1'|'b1';d:{d1:string}}",parent);
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