import { Block, Blockchain } from './types/block'
import { Transaction } from './types/transaction'
import { sha256 } from '../lib/crypto'
import { createCoinbaseTx } from './transaction'
import { UTxO, Context } from './types/context'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'

import { INITIAL_DIFFICULTY } from './constants.json'
import { difficultyConstant } from './miner'
import { log } from '../lib/log'

export const getHash = (data: object): string => sha256(JSON.stringify(data))

export const myKey = {
  "alias": "myKeys1",
  "sk": "110efe13c20b8278881fc366f64e695c6880f67a37f75eabd3fea2e7f9b6f342",
  "pk": "04f6ccb16803516a2e5c9bbf12dcea1a802e55e51c04b915142c25c2336cf7a428a1f3cae1854a722435aa7004f517ede361e9f940f54ce091fe3273a497aa6170",
  "pkh": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX"
}

const createGenesisBlock = (genesisTimestamp: number): Block => {
  const genesisCoinbase = createCoinbaseTx(0)
  const transactions = [genesisCoinbase]

  log(genesisTimestamp.toString())

  const header = {
    level: 0,
    previousHash: '0'.repeat(64),
    timestamp: genesisTimestamp,
    miner: myKey.pkh, // 하드코딩
    txsHash: sha256(JSON.stringify(transactions)),
    nonce: 0,
    difficulty: INITIAL_DIFFICULTY
  }
  const hash = getHash(header)

  return {
    hash,
    header,
    transactions
  }
}


let blockchain: Blockchain = []
const context: Context = []
export const getHeadContext = () => cloneDeep(context[context.length - 1])

// We need to compute 2**256 / (bnTarget+1)
const nChainWork: bigint[] = [] // accumulated difficulties for every block
export const getNChainWork = () => nChainWork

export const initialize = (genesisTimestamp: number) => {
  const genesisBlock: Block = createGenesisBlock(genesisTimestamp)
  blockchain.push(genesisBlock)
  updateContext(genesisBlock)
}

export const getBlockchain = () => blockchain
export const getHead = () => blockchain[blockchain.length - 1]
export const replaceChain = (candidateChain: Blockchain) => {
  const lb = candidateChain[0].header.level
  const localChain = getBlockchain()
  blockchain = localChain.slice(0, lb)
  candidateChain.forEach(block => processBlock(block))
}

export const processBlock = (block: Block) => {
  pushBlock(block)
  updateContext(block)
}

export const getTimestamp = () => parseInt((new Date().getTime() / 1000).toString())

export const pushBlock = (block: Block) => {
  log(`[blockchain] !! block pushed, ${block.header.level}`)
  getBlockchain().push(block)
}

// update utxo set
export const updateContext = (block: Block) => {
  const { transactions } = block

  // genesis block needs utxo set pre-initialized to {}
  const utxoSet = getHeadContext() || {}

  transactions.forEach(tx => {
    // add new txOuts
    tx.txOuts.forEach((txOut, _idx) => {
      const utxo = {
        txOutId: tx.txId,
        txOutIdx: _idx,
        address: txOut.address,
        amount: txOut.amount
      }
      utxoSet[`tx.txId_${_idx}`] = utxo
    })
  })

  context[block.header.level] = utxoSet

  // update nChainWork
  const nChainWork = getNChainWork()
  const prevNChainWork = nChainWork[block.header.level - 1] || BigInt(0)
  const difficulty = block.header.difficulty
  const target = BigInt(difficultyConstant / difficulty)

  nChainWork[block.header.level] = prevNChainWork + BigInt(2 ** 256) / (target + BigInt(1))
}