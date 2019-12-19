import { Transaction } from "./transaction";

export interface Block {
    hash: string,
    header: {
        level: number,
        previousHash: string,
        timestamp: number,
        miner: string,
        txsHash: string,
        nonce: number,
        difficulty: number
    },
    transactions: Transaction[],
}

export type Blockchain = Block[]