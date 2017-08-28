import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
/**
 * 发表新的评论
 */
export default new Protocol<ReqGetComment,ResGetComment>({
    url: 'GetComment',
    method: 'GET',
    needLogin: false
})

export interface ReqGetComment extends Request {
    targetId: string;
    targetType: number;
}

export interface CommentItem{
    userName: string;
    commentId: string;
    commentText: string;
    iconUrl: string;
    createTime: number;
    replyCount: number;
}

export interface ResGetComment extends Response {
    comments: CommentItem[];
}