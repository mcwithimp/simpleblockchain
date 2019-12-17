export type Transaction = string

export interface Block {
    hash: string,
    header: {
        level: number,
        previousHash: string,
        timestamp: number,
        txsHash: string
    },
    transactions: Transaction[],
}

export type Blockchain = Block[]