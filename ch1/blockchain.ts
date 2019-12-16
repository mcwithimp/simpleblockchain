import { Block, Blockchain } from './types/types'
import { sha256 } from './crypto'

const createGenesisBlock = (): Block => {
  const data = "The Times 16/Dec/2019 XXXXX"
  const header = {
    level: 0,
    previousHash: '0'.repeat(64),
    timestamp: 1576482055,
    dataHash: sha256(data)
  }

  return {
    header,
    data
  }
}

const genesisBlock : Block = createGenesisBlock();

export let blockchain: Blockchain = [genesisBlock];

const getTimestamp = () => parseInt((new Date().getTime() / 1000).toString(), 10)
const getHead = () => blockchain[blockchain.length - 1]

export const calculateBlockHash = (header : Block["header"]) : string => {
    const keys = ["level", "previousHash", "timestamp", "dataHash"]
    const serialized = keys.reduce((acc, cur) => acc + JSON.stringify(header[cur]), "")
    return sha256(serialized)
}

export const createNewBlock = (data: string): Block => {
    const head = getHead()
    const level = head.header.level + 1
    const previousHash = calculateBlockHash(head.header)
    const timestamp = getTimestamp()
    const dataHash = sha256(data)

    return {
      header: {
        level,
        previousHash,
        timestamp,
        dataHash
      },
      data
    }
}

