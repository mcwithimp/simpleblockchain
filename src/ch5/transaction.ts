import { Transaction } from "./types/transaction"
import { myKey } from './blockchain'

import { BLOCK_REWARD } from './constants.json'
import { sha256, sign } from "../lib/crypto"

export const createCoinbaseTx = (blockLevel: number): Transaction => {
  const txIns = [{
    txOutId: '0'.repeat(64),
    txOutIdx: blockLevel
  }]
  const txOuts = [{
    address: myKey.pkh,
    amount: BLOCK_REWARD
  }]

  const txId = sha256(JSON.stringify({ txIns, txOuts }))
  const signature = sign(myKey.sk, txId)

  return {
    txId,
    txIns,
    txOuts,
    signature
  }
}
