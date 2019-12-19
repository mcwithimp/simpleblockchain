import { Block, Blockchain } from './types/block'
import { Transaction } from './types/transaction'
import { sha256 } from '../lib/crypto'
import { createCoinbaseTx } from './transaction'
import { UTxO, Context } from './types/context'
import clonedeep from 'lodash.clonedeep'

export const getHash = (data: object): string => sha256(JSON.stringify(data))

export const myKey = {
  "alias": "myKeys1",
  "sk": "110efe13c20b8278881fc366f64e695c6880f67a37f75eabd3fea2e7f9b6f342",
  "pk": "04f6ccb16803516a2e5c9bbf12dcea1a802e55e51c04b915142c25c2336cf7a428a1f3cae1854a722435aa7004f517ede361e9f940f54ce091fe3273a497aa6170",
  "pkh": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX"
}

const createGenesisBlock = (): Block => {
  const genesisCoinbase = createCoinbaseTx(0)
  const transactions = [genesisCoinbase]
  const header = {
    level: 0,
    previousHash: '0'.repeat(64),
    timestamp: 1576482055,
    miner: "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX", // 하드코딩
    txsHash: getHash(transactions)
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
export const getHeadContext = () => clonedeep(context[context.length - 1])

export const initialize = () => {
  const genesisBlock: Block = createGenesisBlock()
  blockchain.push(genesisBlock)
  updateContext(genesisBlock)
}

export const getBlockchain = () => blockchain
export const getHead = () => blockchain[blockchain.length - 1]

const getTimestamp = () => Math.floor(new Date().getTime() / 1000)

export const createNewBlock = (txFromMempool: Transaction[]): Block => {
  // ...
  const head = getHead()
  const coinbaseTx = createCoinbaseTx(head.header.level + 1)
  const transactions = [coinbaseTx, ...txFromMempool]

  const header = {
    level: head.header.level + 1,
    previousHash: head.hash,
    timestamp: getTimestamp(),
    miner: myKey.pkh,
    txsHash: getHash(transactions)
  }
  const hash = getHash(header)

  return {
    hash,
    header,
    transactions
  }
}

export const pushBlock = (block: Block) => {
  getBlockchain().push(block)
}

// update utxo set
export const updateContext = (block: Block) => {
  const { transactions } = block

  // genesis block needs utxo set pre-initialized to {}
  const utxoSet = getHeadContext() || {}

  transactions.forEach(tx => {
    // add new txOuts
    const utxos = tx.txOuts.forEach((txOut, _idx) => {
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
}

