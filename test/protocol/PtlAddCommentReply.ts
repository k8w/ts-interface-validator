import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
import {CommentReplyItem} from "./PtlGetCommentReply";
/**
 * 发表新的评论
 */
export default new Protocol<ReqAddCommentReply,ResAddCommentReply>({
    url: 'AddCommentReply',
    method: 'POST',
    needLogin: true
})

export interface ReqAddCommentReply extends Request {
    /** 评论对象Id,如类型为吐槽则固定为-1 */
    targetId: string;
    /** targetType(类型: 1:吐槽,2:全景图评论) */
    targetType: number;
    replyText: string;
    commentId: string;
}


export interface ResAddCommentReply extends Response {
    data:CommentReplyItem;
}