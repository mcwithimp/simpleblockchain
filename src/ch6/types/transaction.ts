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

export interface TransactionInput {
  from: string,
  to: string,
  amount: number
}

export type Mempool = Transaction[]
