import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
import {CommentItem} from "./PtlGetComment";
/**
 * 发表新的评论
 */
export default new Protocol<ReqAddComment,ResAddComment>({
    url: 'AddComment',
    method: 'POST',
    //TODO 测试改为不需要登陆
    needLogin: true
    // needLogin: false
})

export interface ReqAddComment extends Request {
    /** 评论对象Id,如类型为吐槽则固定为-1 */
    targetId: string;
    /** targetType(类型: 1:吐槽,2:全景图评论) */
    targetType: number;
    commentText: string;
}


export interface ResAddComment extends Response {
    data:CommentItem;
}