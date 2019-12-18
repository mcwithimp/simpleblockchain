export type Transaction = string

export interface Block {
    hash: string,
    header: {
        level: number,
        previousHash: string,
        timestamp: number,
        miner: string, 
        txsHash: string
    },
    transactions: Transaction[],
}

export type Blockchain = Block[]