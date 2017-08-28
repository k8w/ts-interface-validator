import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
import {ChartStructure} from "./PtlGetPanorama";
/**
 * 获取首页信息
 */

export default new Protocol<ReqGetHomePage,ResGetHomePage>({
    url: 'GetHomePage',
    method: 'GET',
    needLogin: false
});

/**
 *
 */
export interface ReqGetHomePage extends Request {

}

/**
 * ResGetHomePage: 返回首页的信息
 * TodaysFocus：每日关注品种
 */
export interface ResGetHomePage extends Response {
    data:TodaysFocus[];
}


/**
 * TodaysFocus:每日关注
 * title：每日关注的标题
 * chartId：图表ID
 * panoramaId：全景图数据ID
 * updateTime: 更新时间
 * detail：每日关注详细内容
 */
export interface TodaysFocus {
    title:string;
    bigChart:ChartStructure;
    panoramaId:string;
    updateTime:string;
    detail:TodaysFocusDetail[];
}

/**
 * TodaysFocusDetail: 每日关注中的品种的信息
 * topicName: 副标题
 * properties: 品种信息
 */
export interface TodaysFocusDetail {
    topicName:string;
    properties:TodaysFocusDetailProperties[];
}

/**
 * TodaysFocusDetailProperties: 品种信息属性
 * showName：用于显示的属性名
 * indicName: 属性名
 * indicId： 属性ID
 * unit: 属性单位
 * dataValue：属性值
 * periodDate：时间
 */
export interface TodaysFocusDetailProperties {
    showName:string;
    indicName:string;
    indicId:string;
    unit:string;
    dataValue:string;
}