import { Block, Blockchain, Transaction } from './types/types'
import { sha256 } from './crypto'
import * as constants from './constants.json'
import { genesisCoinbaseTx } from './miner'

const { COINBASE_AMOUNT, SATOSHI } = constants

export const calculateBlockHash = (blockHeader: Block["header"]): string => sha256(JSON.stringify(blockHeader))

const createGenesisBlock = (): Block => {
  const transactions = [genesisCoinbaseTx]
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

const genesisBlock : Block = createGenesisBlock();

export let blockchain: Blockchain = [genesisBlock];

export const getHead = () => blockchain[blockchain.length - 1]



