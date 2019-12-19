import { BLOCK_INTERVAL } from './constants.json'
import { getHead, getBlockchain } from './blockchain'
import { Blockchain, Block } from './types/block.js'
import isEqual from 'lodash.isequal'
import { sha256 } from '../lib/crypto.js'

export const calculateBlockHash = (blockHeader: Block["header"]): string => sha256(JSON.stringify(blockHeader))
export const getTimestamp = () => Math.floor(new Date().getTime() / 1000)


// From bitcoin wiki
// A timestamp is accepted as valid 
// if it is greater than the median timestamp of previous 11 blocks, 
// and less than the network - adjusted time + 2 hours. (2 hours = 12 times BLOCK_INTERVAL)
// Adjusting time is because of asynchronous time between processes assumption 
// which we don't care 
export const verifyTimestamp = (level: number, timestamp: number) : boolean => {
  const head = getHead()
  if (level > head.header.level + 1) return false

  const lb = Math.max(level - 11, 0)
  const left = getBlockchain()[lb].header.timestamp
  const right = getBlockchain()[level - 1].header.timestamp
  // rounded down for generosity
  const lowerBound = Math.floor((left + right) / 2)
  const upperBound = getTimestamp() + (BLOCK_INTERVAL * 12)

  return (
    lowerBound <= timestamp &&
    timestamp <= upperBound
  )
}

export const verifyBlock = (block: Block) : boolean => {

  const { hash, header, transactions } = block






  return true


}

export const verifyChain = (candidateChain: Blockchain) : boolean => {
  const localChain = getBlockchain()
  const lb = candidateChain[0]

  // if candidateChain includes the genesis block
  if (lb.header.level === 0) {
    // check if two genesis blocks are the same
    const localGenesisBlock = localChain[0]
    if (isEqual(localGenesisBlock, candidateChain[0]) === false) {
      console.log('The remote genesis block is invalid!')
      return false
    }
  } else if (
    localChain[lb.header.level - 1] === undefined ||
    localChain[lb.header.level - 1].hash !== lb.header.previousHash) {
    console.log("The candidate chain can not be connected to localChain")
    return false
  }

  // now we can replace the part or all of localChain with candidateChain

  
    

}


