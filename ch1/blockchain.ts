import { Block, Blockchain, Transaction } from './types/types'
import { sha256 } from './crypto'

export const calculateBlockHash = (blockHeader: Block["header"]): string => sha256(JSON.stringify(blockHeader))

const createGenesisBlock = (): Block => {
  const genesisTx = "Alice sends 50 btc to Bob"
  const transactions = [genesisTx]
  const header = {
    level: 0,
    previousHash: '0'.repeat(64),
    timestamp: 1576482055,
    txsHash: sha256(JSON.stringify(transactions))
  }
  const hash = calculateBlockHash(header)

  return {
    hash,
    header,
    transactions
  }
}

const genesisBlock : Block = createGenesisBlock();

export let blockchain: Blockchain = [genesisBlock];

const getTimestamp = () => parseInt((new Date().getTime() / 1000).toString(), 10)
const getHead = () => blockchain[blockchain.length - 1]

export const createNewBlock = (transactions: Transaction[]): Block => {
  const head = getHead()
  const header = {
    level: head.header.level + 1,
    previousHash: calculateBlockHash(head.header),
    timestamp: getTimestamp(),
    txsHash: sha256(JSON.stringify(transactions))
  }
  const hash = calculateBlockHash(header)

  return {
    hash,
    header,
    transactions
  }
}

