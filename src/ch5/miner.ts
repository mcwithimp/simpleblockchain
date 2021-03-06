import {
  BLOCK_INTERVAL,
  DIFFICULTY_PERIOD,
} from './constants.json'
import { Block } from './types/block'
import { getBlockchain, getHead, myKey, processBlock } from './blockchain'
import { getHash, getTimestamp } from './verifier'
import { broadcastNextBlock } from './node'
import { createCoinbaseTx } from './transaction'
import { sha256 } from '../lib/crypto'
import { Transaction } from './types/transaction'
import { log } from '../lib/log'

export const difficultyConstant = 0xffff * 256 ** (0x1d - 3)

const miningContext = {
  intervalContext: null // timer
}

export const getTxFromMempool: () => Transaction[] = () => []

export const initialize = () => {
  requestMine(getTxFromMempool())
  log('miner started')
}

// changes mining context.
// our miner is "always" working for something,
// changing context will signal new block
export const requestMine = async (
  txFromMempool: Transaction[]
) => {
  const head = getHead()
  const coinbaseTx = createCoinbaseTx(head.header.level + 1)
  const transactions = [coinbaseTx, ...txFromMempool]

  const nextBlockHeader = {
    level: head.header.level + 1,
    previousHash: head.hash,
    timestamp: getTimestamp(),
    miner: myKey.pkh,
    txsHash: getHash(transactions),
    nonce: 0,
    difficulty: -1 // placeholder
  }

  log(`[miner] request new mining session for level ${nextBlockHeader.level}`)

  const difficulty = nextBlockHeader.difficulty = calculateDifficulty(nextBlockHeader)
  const target = BigInt(difficultyConstant / difficulty)

  // stop previous mining loop
  clearInterval(miningContext.intervalContext)

  // start a new mining loop
  miningContext.intervalContext = setInterval(() => {
    // up nonce
    nextBlockHeader.nonce++

    const mined = mine(nextBlockHeader, target)

    // if answer is not found, do nothing
    if (!mined) return

    // if answer __IS__ found, push this block and request new mine
    const { hash, header } = mined
    const nextBlock = { hash, header, transactions }

    processBlock(nextBlock)
    broadcastNextBlock(nextBlock)

    // another loop.. tail call
    requestMine(getTxFromMempool())
  }, 0)
}

export const pauseMine = () => {
  log('[miner] -- mining paused for sync')
  clearInterval(miningContext.intervalContext)
}


interface MineResult {
  hash: string,
  header: Block["header"]
}

export const mine = (
  nextBlockHeader: Block["header"],
  target: bigint
): MineResult | null => {
  const blockHash = getHash(nextBlockHeader)

  // if blockHash is highter than the target,
  // we haven't "mined" yet
  if (BigInt(`0x${blockHash}`) >= target) return null

  // if our blockHash is lower than the target,
  // then we have "mined" and proven our work
  log(`[miner] block created ${JSON.stringify({ level: nextBlockHeader.level })}`)

  return {
    hash: blockHash,
    header: nextBlockHeader
  }
}

const calculateDifficulty = (nextBlockHeader: Block["header"]) => {
  const { level, timestamp } = nextBlockHeader
  const blockchain = getBlockchain()

  if ((level % DIFFICULTY_PERIOD) !== 0) return getHead().header.difficulty

  const lastCalculatedBlock = blockchain[level - DIFFICULTY_PERIOD]
  const lastCalculatedDifficulty = lastCalculatedBlock.header.difficulty

  const previousTarget = difficultyConstant / lastCalculatedDifficulty
  const timeDifference = timestamp - lastCalculatedBlock.header.timestamp
  const timeExpected = BLOCK_INTERVAL * DIFFICULTY_PERIOD

  const nextTarget = previousTarget * timeDifference / timeExpected
  const nextDifficulty = difficultyConstant / nextTarget

  return nextDifficulty
}