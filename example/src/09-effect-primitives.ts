
class SyncOp<A>{
    readonly _tag = "SyncOp"
    constructor(
        readonly fn: () => A
    ){}
}
export function sync<A>(fn: () => A){
    return new SyncOp(fn)
}

class AsyncOp<A>{
    readonly _tag = "AsyncOp"
    constructor(
        readonly fn: () => Promise<A>
    ){}
}
export function async<A>(fn: () => Promise<A>){
    return new AsyncOp(fn)
}

export type Effect<A> = SyncOp<A> | AsyncOp<A>
