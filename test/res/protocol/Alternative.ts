export interface WithSymbolId {
    symbolId: string;
    symbolCode     :    undefined    ;
}

export interface WithSymbolCode {
    symbolId  : undefined               ;
    symbolCode            : string         ;
}

export interface ReqBody {
    value: 'yes' | 'no'
}

export type Req = ReqBody & (WithSymbolId | WithSymbolCode);