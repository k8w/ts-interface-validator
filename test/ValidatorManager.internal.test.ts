import ValidatorManager from '../src/ValidatorManager';
import * as assert from 'assert';

describe('ValidatorManager.internal', function () {
    let manager = new ValidatorManager();

    describe('getTypeDefFromFileContent', function () {
        let src = `import xxx from 'xxx';
        export type StringAlias = string;
        type NumberAlias = number
        
        export type Test = {
            testValue: string;
        }

        export type TestAndValue = Test & {
            value: string
        }

        export type ComplexLogic1 = (Test1 | Test2) & (Test3 | Test4);
        export type ComplexLogic2 = {
            value: (Test1 | Test2) & (Test3 | Test4)
        } | Test5
        `;

        it('basic type', function () {
            assert.equal((manager as any).getTypeDefFromFileContent('StringAlias', src), 'string');
            assert.equal((manager as any).getTypeDefFromFileContent('NumberAlias', src), 'number');
        })

        it('builtin interface', function () {
            assert.equal((manager as any).getTypeDefFromFileContent('Test', src), `{
            testValue: string;
        }`);
        })

        it('logic expression', function () {
            assert.equal((manager as any).getTypeDefFromFileContent('TestAndValue', src), `Test & {
            value: string
        }`);
        })

        it('complex logic', function () {
            assert.equal((manager as any).getTypeDefFromFileContent('ComplexLogic1', src), `(Test1 | Test2) & (Test3 | Test4)`);
            assert.equal((manager as any).getTypeDefFromFileContent('ComplexLogic2', src), `{
            value: (Test1 | Test2) & (Test3 | Test4)
        } | Test5`);
        })
    })

    it('getInterfaceDefFromFileContent', function () {
        let src = `
            import ImpTest from 'xxxx';

            export interface Test {
                a: string;
                b: number;
                c: {
                    value: ImpTest;
                }
            }
        `;
        assert.equal((manager as any).getInterfaceDefFromFileContent('Test', src), `interface Test {
                a: string;
                b: number;
                c: {
                    value: ImpTest;
                }
            }`)
    })
})