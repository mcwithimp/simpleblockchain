import { BLOCK_INTERVAL } from './constants.json'
import { getHead, getBlockchain, getHeadContext, getMempool } from './blockchain'
import { Blockchain, Block } from './types/block'
import isEqual from 'lodash.isequal'
import { sha256, verifySign } from '../lib/crypto'
import { difficultyConstant } from './miner'
import { Transaction, TxIn } from './types/transaction'
import { UTxOSet } from './types/context.js'

export const getHash = (data: object): string => sha256(JSON.stringify(data))
export const getTimestamp = () => Math.floor(new Date().getTime() / 1000)


// From bitcoin wiki
// A timestamp is accepted as valid 
// if it is greater than the median timestamp of previous 11 blocks, 
// and less than the network - adjusted time + 2 hours. (2 hours = 12 times BLOCK_INTERVAL)
// Adjusting time is because of asynchronous time between processes assumption which we don't care 
export const verifyTimestamp = (previousTime: number, newTime: number) : boolean => {
  const lowerBound = previousTime - (BLOCK_INTERVAL * 6)
  const upperBound = getTimestamp() + (BLOCK_INTERVAL * 12)
  return (
    lowerBound <= newTime &&
    newTime <= upperBound
  )
}

export const verifyBlock = (block: Block) : boolean => {

  const { hash, header, transactions } = block

  // check hash values are calculated correctly
  if (getHash(transactions) !== header.txsHash) {
    console.log("TxsHash is not valid!")
    return false
  } else if(getHash(header) !== hash) {
    console.log("BlockHash is not valid!")
    return false
  }

  // verify proof of work
  const difficulty = header.difficulty
  const target = BigInt(difficultyConstant / difficulty)
  if (BigInt(`0x${hash}`) >= target) {
    console.log("PoW is not valid!")
    return false
  }

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
  } else if ( // if there are missing links
    localChain[lb.header.level - 1] === undefined ||
    localChain[lb.header.level - 1].hash !== lb.header.previousHash) {
    console.log("The candidate chain can not be connected to localChain!")
    return false
  }

  // now we can replace the part or all of localChain with candidateChain
  // copy and merge the chain
  const merged = lb.header.level === 0
    ? candidateChain
    : [localChain[lb.header.level - 1]].concat(candidateChain)


  // check level, timestamp, previousHash and block itself 
  const isChainValid = merged.slice(1).every((block, _idx) => {
    if (block.header.level !== merged[_idx].header.level + 1) {
      console.log("Block level is not valid!")
      return false
    } else if (block.header.previousHash !== merged[_idx].hash) {
      console.log("Previous hash is not valid!")
      return false
    } else if (verifyTimestamp(merged[_idx].header.timestamp, block.header.timestamp) === false) {
      console.log("Timestamp value is not valid!")
      return false
    } else if (verifyBlock(block) === false) return false

    return true
  })

  return isChainValid
}

export const verifyTxIns = (
  txIns: TxIn[], 
  headContext: UTxOSet, 
  txId: string, 
  signature: string): boolean => {

  const isTxInsValid = txIns.every(txIn => {
    const target = `${txIn.txOutId}_${txIn.txOutIdx}`
    const isUnspent = headContext.hasOwnProperty(target)

    if (isUnspent === false) {
      console.log("Claimed utxo doesn't exist!")
      return false
    }

    const address = headContext[target].address
    if (verifySign(txId, signature, address) === false) {
      console.log("Tx's signature is not valid!")
      return false
    }

    return true
  })

  return isTxInsValid
}

const isTxInDoubledClaimed = (candidateTx: Transaction): boolean => {
  const mempool = getMempool()

  for(const txInMempool of mempool) {
    for(const txIn of txInMempool.txIns) {
      const isDuplicated = candidateTx.txIns.find(candidateTxIn => {
        return (
          candidateTxIn.txOutId === txIn.txOutId &&
          candidateTxIn.txOutIdx === txIn.txOutIdx 
        )
      })

      if (isDuplicated) return true
    }
  }

  return false
}

export const verifyTx = (tx: Transaction) : boolean => {
  const headContext = getHeadContext()
  const { txId, txIns, txOuts, signature } = tx

  if (isTxInDoubledClaimed(tx) === true) {
    console.log("One of TxIns is doubly claimed!")
    return false
  }

  if (getHash({txIns, txOuts}) !== txId) {
    console.log("TxId is not valid!")
    return false
  } else if (verifyTxIns(txIns, headContext, txId, signature) === false) {
    console.log("Claim of txIns is not valid!")
    return false
  }

  const txInsAmount = tx.txIns
    .map(txIn => headContext[`${txIn.txOutId}_${txIn.txOutIdx}`].amount)
    .reduce((sum, amount) => sum + amount, 0)

  const txOutsAmount = tx.txOuts.reduce(
    (sum, txOut) => sum + txOut.amount,
    0
  )
  
  
  if (txInsAmount !== txOutsAmount) {
    console.log("TxIns' amount is different with TxOuts' amount!")
    return false
  }

  return true
}


