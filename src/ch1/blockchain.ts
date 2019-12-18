import { Block, Blockchain, Transaction } from './types/block'
import { sha256 } from '../lib/crypto'

export const calculateBlockHash = (blockHeader: Block["header"]): string => sha256(JSON.stringify(blockHeader))

const myKey = {
  "alias": "myKeys1",
  "sk": "110efe13c20b8278881fc366f64e695c6880f67a37f75eabd3fea2e7f9b6f342",
  "pk": "04f6ccb16803516a2e5c9bbf12dcea1a802e55e51c04b915142c25c2336cf7a428a1f3cae1854a722435aa7004f517ede361e9f940f54ce091fe3273a497aa6170",
  "pkh": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX"
}

const createGenesisBlock = (): Block => {
  const transactions = ["Alice sends 10 btc to Bob"]
  const header = {
    level: 0,
    previousHash: '0'.repeat(64),
    timestamp: 1576482055,
    miner: "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX", // 하드코딩
    txsHash: sha256(JSON.stringify(transactions))
  }
  const hash = calculateBlockHash(header)

  return {
    hash,
    header,
    transactions
  }
}

const genesisBlock: Block = createGenesisBlock()

let blockchain: Blockchain = [genesisBlock]
export const getBlockchain = () => blockchain

export const getHead = () => blockchain[blockchain.length - 1]


const getTimestamp = () => parseInt((new Date().getTime() / 1000).toString())

export const createNewBlock = (transactions: Transaction[]): Block => {
  const head = getHead()
  const header = {
    level: head.header.level + 1,
    previousHash: calculateBlockHash(head.header),
    timestamp: getTimestamp(),
    miner: myKey.pkh,
    txsHash: sha256(JSON.stringify(transactions))
  }
  const hash = calculateBlockHash(header)

  return {
    hash,
    header,
    transactions
  }
}

export const pushBlock = (block: Block) => {
  getBlockchain().push(block)
}
