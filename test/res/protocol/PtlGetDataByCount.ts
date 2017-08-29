import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
/**
 * PtlDataByCount:获取指定笔数的数据
 */
export default new Protocol<ReqGetDataByCount,ResGetDataByCount>({
    url: 'GetDataByCount',
    method: 'GET',
    needLogin: false
});

/**
 * dataId:数据ID
 * count: 数量
 */
export interface ReqGetDataByCount extends Request {
    id:string;
    count?:number;
    endTime?:number;
}

/**
 * dataId:数据ID
 * name:数据名
 * endTime：结束时间
 * count:数量
 * actualData:实际数据
 *      dataTime：日期时间
 *      value：数据数值
 */
export interface ResGetDataByCount extends Response {
    id:string;
    name?:string;
    endTime?:string;
    count?:number;
    data?:{
        timestamp:number,
        value:number | number[];
    }[];
    valueType:'single' | 'ohlc';
}