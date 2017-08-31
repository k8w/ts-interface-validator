TypeScript Interface Validator
---------------------------------

## Intro

A library to validate whether a value is matched a typescript interface definition.

This is a lightweight and individual implementaion. So only support limited forms of definition.

For more detail you can see *Supported* and *Not Supported* below.

If you should have any question, please feel free to let me know.

## Usage

```typescript
//Get interface validator from file
import TsInterfaceValidator from 'ts-interface-validator';
let validator = TsInterfaceValidator.getInterfaceValidator('xxx/xxx.ts', 'InterfaceName');

//Validate
let toValidateValue = xxx;
let result = validator.validate(toValidateValue);

//Process with validate result
if(result.isSuccess){
    //succ
}
else{
    //error
    console.log(result.message);    //Error message in top level
    console.log(result.originalError.message);  //Error message in minimal level
}

if(result.isError){
    //error
}
```



### Supported

1. Basic type as  `string`, `number`, `boolean`, `Object`, `any`
1. Array type as `T[]` or `Array<T>`
1. Type alias as `type Abc = string`
1. Nested referenced interface, as `type Bcd = Abc`
1. Logical expression, such as `string | number`
1. String literal，as `'Value1' | 'Value2'`
1. Relative import
1. Extend, as `interface Def extends Abc { ... }`
1. Index signature, as `{ [key: string]: number }`
1. Partial type, as `Partial<T>`
1. Ignore comments automatically

### Not Supported (temporarily)

1. import must be finished in single line, and must be ended with semicolon
1. Mapped Types
1. Circular reference