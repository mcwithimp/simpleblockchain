export interface UTxO {
  txOutId: string,
  txOutIdx: number,
  address: string,
  amount: number
}

export interface TxIn {
  txOutId: string,
  txOutIdx: number
}

export interface TxOut {
  address: string,
  amount: number
}

export interface Transaction {
  txId: string,
  txIns: TxIn[],
  txOuts: TxOut[],
  signature: string
}

type Mempool = Transaction[]

export interface Keys {
  alias: string,
  sk: string,
  pk: string,
  pkh: string
}

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