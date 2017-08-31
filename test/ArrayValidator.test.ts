import {ValidateErrorCode} from "../src/models/ValidateResult";
import ArrayValidator from "../src/validators/ArrayValidator";
import InterfaceValidator from "../src/validators/InterfaceValidator";
import ValidatorManager from '../src/ValidatorManager';
const assert = require('assert');

describe('ArrayValidator', function () {
    let manager = new ValidatorManager();

    it('validate number[]', function(){
        let validator = new ArrayValidator('number[]', manager);
        assert.equal(validator.validate([1,1,1,1]).errcode, 0);
        assert.equal(validator.validate([]).errcode, 0);
        assert.equal(validator.validate([1]).errcode, 0);
        assert.equal(validator.validate([1,2,3,null]).errcode, ValidateErrorCode.ArrayNotMatch);
        assert.equal(validator.validate([1,2,3,'4']).errcode, ValidateErrorCode.ArrayNotMatch);
        assert.equal(validator.validate([1,2,3,true]).errcode, ValidateErrorCode.ArrayNotMatch);

        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate(0).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate(NaN).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate(Infinity).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate('123').errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate('test').errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotArray);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotArray);
    });
});