import { Transaction } from "./types/transaction"
import { myKey } from './blockchain'

import { BLOCK_REWARD } from './constants.json'
import { signTx } from "../lib/crypto"
import { getHash } from "./verifier"

export const createCoinbaseTx = (blockLevel: number): Transaction => {
  const txIns = [{
    txOutId: '0'.repeat(64),
    txOutIdx: blockLevel
  }]
  const txOuts = [{
    address: myKey.pkh,
    amount: BLOCK_REWARD
  }]

  const txId = getHash({ txIns, txOuts })
  const signature = signTx(myKey.sk, txId)

  return {
    txId,
    txIns,
    txOuts,
    signature
  }
}
