interface Validator
----------------------------------------------

## 不支持的几种情况

1. 不支持interface循环嵌套，如
```ts
interface A{
    b: B;
}

interface B{
    a: A;
}
```
1. 不支持跨文件引用interface，引用的interface必须要在同一文件
1. 根据分号来分割字段，所以嵌套的interface定义内部请使用逗号，如
```
interface A{
    b:{
        b1:string,  //此处请使用字符串 不要使用number
        b2:number
    }
}
}
```

## 校验过程

### 输入

1. 待validate的，及import的interface。
1. 检验到错误时，是立刻中止，还是检验完所有字段（暴露所有错误）。

### 返回

1. 结果: boolean
1. 错误细节: Array
    1. 错误发生在哪个字段
    1. 具体错误 innerException
        1. required but get null
        1. logic result false
        1. basic type error: is not array | is not basic type
        1. array item type error
        1. child interface type error

### Validate过程

1. interface validator
    1. single field validator
        1. check Required
        1. split by logic operation
            1. AND
            1. OR
            1. 然后分别递归做single field validator
        1. `Array<T>`
            1. check isArray
            1. check every item is T
            1. 对item&T递归做single field validator
        1. interface
            1. 递归做interface validator
        1. 是基类型，做检查，返回boolean
            1. 固定内容，如：a: 'test1' | 'test2'
            1. string
            1. number
            1. boolean
            1. any
            1. Object