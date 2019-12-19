import { Transaction } from "./types/transaction"
import { myKey, getHeadContext } from './blockchain'

import { BLOCK_REWARD } from './constants.json'
import { signTx } from "../lib/crypto"
import { getHash } from "./verifier"
import { UTxO } from "./types/context"

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

interface KeyResult {
  alias: string,
  sk: string,
  pk: string,
  pkh: string
}

const getUTxOs = (owner: string): UTxO[] => {
  const utxos = getHeadContext()
  const myUTxOs = Object.keys(utxos)
    .map(key => utxos[key])
    .filter(utxo => utxo.address === owner)
 
  return myUTxOs
}

export const getKeys = (): KeyResult => {
  return myKey
}

export const transfer = (from: string, to: string, amount: number) => {
  const keys = getKeys()
  const myUTxOs = getUTxOs(keys.pkh)

  // check utxo pending in mempool

} 