import {
  BLOCK_INTERVAL,
  DIFFICULTY_PERIOD
} from './constants.json'
import { Block } from './types/block'
import { getBlockchain, calculateBlockHash, getHead } from './blockchain'
import BN from 'bn.js'

interface MineResult {
  hash: string,
  header: Block["header"]
}

const difficultyConstant = 0xffff * 256 ** (0x1d - 3)

export const mine = (nextBlockHeader: Block["header"]): MineResult => {

  // should change difficulty?
  const difficulty = calculateDifficulty(nextBlockHeader)
  const target = BigInt(difficultyConstant / difficulty)
  
  nextBlockHeader.difficulty = difficulty

  let nonce = 0;
  let blockHash: string = '';

  while(true) {
    nextBlockHeader.nonce = nonce
    blockHash = calculateBlockHash(nextBlockHeader)
    
    // console.log({blockHash})
    // console.log({difficulty})
    // process.stdout.write(`\r${BigInt(`0x${blockHash}`)}`)
    // console.log(new BN(blockHash))
    // console.log(new BN(target.toString()))
    if(BigInt(`0x${blockHash}`) < BigInt(target)) break;

    nonce++
  }

  console.log('block created', {
    level: nextBlockHeader.level,
    difficulty: nextBlockHeader.difficulty,
    nonce,
    hash__: BigInt(`0x${blockHash}`),
    target: target
  })

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