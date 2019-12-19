import { Transaction, TxIn } from "./types/transaction"
import { myKey, getHeadContext, getHead, getContext, getMempool } from './blockchain'

import { BLOCK_REWARD } from './constants.json'
import { signTx } from "../lib/crypto"
import { getHash } from "./verifier"
import { UTxO } from "./types/context"

import _ from 'lodash'

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

// from context, get only my undeclared utxos
const getMyUTxOs = (owner: string): UTxO[] => {
  const utxos = getHeadContext()
  const mempool = getMempool() // is a deepclone

  // filter out declared utxos of all owners
  mempool.forEach(tx => {
    tx.txIns.forEach(txIn => {
      const key = `${txIn.txOutId}_${txIn.txOutIdx}`
      delete utxos[key]
    })
  })

  // from undeclared utxos, get only mine
  const myUTxOs = Object.keys(utxos)
    .map(key => utxos[key])
    .filter(utxo => utxo.address === owner)

  return myUTxOs
}

export const getKeys = (): KeyResult => {
  return myKey
}

export const transfer = (from: string, to: string, amount: number): Transaction => {
  const keys = getKeys()
  const myUndeclaredUTxOs = getMyUTxOs(keys.pkh)

  // sort by amount
  myUndeclaredUTxOs.sort((a, b) => a.amount - b.amount)

  // balance check
  const balance = myUndeclaredUTxOs.reduce(
    (sum, utxo) => sum + utxo.amount,
    0
  )

  if(balance < amount) {
    throw new Error('not enough balance')
  }

  // get spending candidates
  let totalAmount = amount
  const toSpend: UTxO[] = []

  while(totalAmount > 0) {
    const utxo = myUndeclaredUTxOs.shift()
    totalAmount = totalAmount - utxo.amount
    toSpend.push(utxo)
  }

  const changeToMe = totalAmount * -1

  // create transactions
  const txIns = toSpend.map(utxo => {
    return {
      txOutId: utxo.txOutId,
      txOutIdx: utxo.txOutIdx
    }
  })

  const txOuts = [
    {
      address: to,
      amount
    }
  ]

  if(changeToMe !== 0) {
    txOuts.push({
      address: from,
      amount: changeToMe
    })
  }

  const txId = getHash({ txIns, txOuts })
  const signature = signTx(keys.sk, txId)

  return {
    txId,
    txIns,
    txOuts,
    signature
  }
} 