import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
/**
 * 获取首页信息
 */

export default new Protocol<ReqGetPanorama,ResGetPanorama>({
    url: 'GetPanorama',
    method: 'GET',
    needLogin: false
});

/**
 * panoramaId:全景图数据ID
 */
export interface ReqGetPanorama extends Request {
    panoramaId:string
}

/**
 * ResGetPanorama: 返回全景图信息
 * data：全景图信息
 */
export interface ResGetPanorama extends Response {
    data:Panorama;
}

/**
 *  Panorama:全景图信息
 * title:标题
 * author:作者
 * preface：开头语
 * conclusion：结束语
 * chartArray：全景图数据ID数组
 */
export interface Panorama {
    title:string;
    author:string;
    preface:string;
    conclusion:string;
    chartArray:ChartStructure[];
}

/**
 * ChartStructure: 全景图数据ID数组
 * dataId: 数据ID
 * name: 数据Name
 * type: 数据类型，目前支持‘ab’ ，‘la'  和 'cms'
 * note:描述
 * series:只有当type为cms时才有，描述了图表由哪些数据组成
 */
export interface ChartStructure {
    dataId:string;
    name:string;
    type:'ab'|'la'|'cms';
    note:string;
    series?:ChartSourceSeries[];
}

/**
 * dataId：原始数据的ID
 * ChartSourceSeries：组成图表的原始数据
 * dataName：线的名称
 * dataUnit：线的单位
 * axis：左右轴，l表示左轴，r表示右轴
 */
export interface ChartSourceSeries {
    dataId:string;
    dataName:string;
    dataUnit:string;
    axis:'l' | 'r';
}