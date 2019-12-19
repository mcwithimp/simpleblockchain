export interface UTxO {
  txOutId: string,
  txOutIdx: number,
  address: string,
  amount: number
}

export type UTxOSet = {
  [key: string]: UTxO
}

export type Context = UTxOSet[]
