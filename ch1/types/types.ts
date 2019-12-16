export interface Block {
    header: {
        level: number,
        previousHash: string,
        timestamp: number,
        dataHash: string
    },
    data: string,
}

export type Blockchain = Block[]