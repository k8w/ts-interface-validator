interface WithSymbolId {
    symbolId: string;
    symbolCode     :    undefined    ;
}

interface WithSymbolCode {
    symbolId  : undefined               ;
    symbolCode            : string         ;
}

interface ReqBody {
    value: 'yes' | 'no'
}

export type Req = ReqBody & (WithSymbolId | WithSymbolCode);