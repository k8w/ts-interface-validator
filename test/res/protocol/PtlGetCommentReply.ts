import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
/**
 * 发表新的评论
 */
export default new Protocol<ReqGetCommentReply,ResGetCommentReply>({
    url: 'GetCommentReply',
    method: 'GET',
    needLogin: false
})

export interface ReqGetCommentReply extends Request {
    targetId: string;
    targetType: number;
    commentId: string;
}

export interface CommentReplyItem{
    replyId: string;
    userName: string;
    replyText: string;
    iconUrl: string;
    createTime: number;
}

export interface ResGetCommentReply extends Response {
    replies: CommentReplyItem[];
}