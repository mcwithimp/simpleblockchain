import WebSocket, { Server as WebSocketServer } from 'ws'

import { BOOTSTRAP_PEERS, FINALITY_THRESHOLD } from './constants.json'
import {
  MessageTypes,
  createPeerRequestMsg,
  createSyncResponseMsg,
  createSyncRequestMsg,
  createPeerResponseMsg,
  createBlockInjectedMsg,
  Message,
  createTxInjectedMsg,
  createMempoolResponseMsg,
  createMempoolRequestMsg
} from './types/messages'
import { getHead, getBlockchain, replaceChain, pushBlock, pushToMempool, flushMempool, processBlock, updateMempool } from './blockchain'
import { Block, Blockchain } from './types/block'
import { verifyChain } from './verifier'
import { getTxFromMempool, requestMine, pauseMine } from './miner'
import { MessageTypeNames } from './types/messages'
import { Transaction, Mempool } from './types/transaction'

// debug
const _send = WebSocket.prototype.send
WebSocket.prototype.send = function () {
  const data = JSON.parse(arguments[0]) as Message
  log(`[outgoing] => ${MessageTypeNames[data.type]}`)
  return _send.call(this, ...arguments)
}

const peers: Map<string, WebSocket> = new Map()

const nodeContext = {
  port: 9732
}

export const initialize = (port: number) => {
  nodeContext.port = port

  const server = new WebSocketServer({ port })
  log('server open')
  server.on('connection', (ws, req) => {
    const { connection } = req
    log(`peer connected`)

    ws.on('close', () => {
      log(`peer closed`)
      peers.delete(`${connection}`)
    })

    ws.on('error', () => {
      log(`peer errored`)
      peers.delete(ws.url)
    })

    messageHandler(ws)
  })

  log('connecting to peers...')

  // connnect to peers
  const myAddr = `localhost:${port}`
  BOOTSTRAP_PEERS.filter(addr => addr !== myAddr).map(connectToPeer)
}

const connectToPeer = async (peerAddress: string) => {
  const peerConnection = new WebSocket(`ws://${peerAddress}`)

  log(`connecting to peer ${peerAddress}`)

  peerConnection.on('close', () => {
    log(`peer ${peerConnection.url} closed`)
    peers.delete(peerConnection.url)
  })

  peerConnection.on('error', () => {
    log(`peer ${peerConnection.url} closed`)
    peers.delete(peerConnection.url)
  })

  // socket is established
  peerConnection.on('open', () => {
    peers.set(peerAddress, peerConnection)

    // ask for blocks
    const localHead = getHead()
    const syncRequestMessage = createSyncRequestMsg(localHead.header)
    peerConnection.send(syncRequestMessage)

    // send my peer list
    const peerRequestMsg = createPeerRequestMsg('localhost', +process.env.port)
    peerConnection.send(peerRequestMsg)

    // send mempool request message
    const mempoolRequestMsg = createMempoolRequestMsg()
    peerConnection.send(mempoolRequestMsg)

    // assign message handler
    messageHandler(peerConnection)
  })
}

const messageHandlers = {
  // peer discovery & management
  [MessageTypes.PEER_REQUEST]: (peer: WebSocket, remote: { ip: string, port: number }) => {
    const peerResponseMsg = createPeerResponseMsg(Array.from(peers.keys()))
    peer.send(peerResponseMsg)
    peers.set(`${remote.ip}:${remote.port}`, peer)
  },

  [MessageTypes.PEER_RESPONSE]: (peer: WebSocket, body: string[]) => {
    body.forEach(address => {
      if(peers.has(address)) return
      connectToPeer(address)
    })
  },

  // here is my latest block, can you all share your blockchain if yours is longer?
  [MessageTypes.SYNC_REQUEST]: (peer: WebSocket, remoteHeader: Block["header"]) => {
    const localHead = getHead()

    // yours is longer than mine, send yours
    if(remoteHeader.level > localHead.header.level) {
      const syncRequestMessage = createSyncRequestMsg(localHead.header)
      peer.send(syncRequestMessage)
    }

    // the same, do nothing (this is competition)
    else if(remoteHeader.level === localHead.header.level) {
      const syncResponseMessage = createSyncResponseMsg(null)
      peer.send(syncResponseMessage)
    }

    // mine is longer, i send mine to you (all)
    // technically speaking we never know when branch split happened
    // but realistically FINALITY_THRESHOLD(30) is probablistic maximum
    else {
      const localChain = getBlockchain()
      const lowerbound = Math.max(remoteHeader.level - FINALITY_THRESHOLD, 0)
      const candidate = localChain.slice(lowerbound, localChain.length)
      const syncResponseMessage = createSyncResponseMsg(candidate)
      peer.send(syncResponseMessage)
    }
  },

  [MessageTypes.SYNC_RESPONSE]: (peer: WebSocket, candidateChain: Blockchain | null) => {
    // if peer sent nothing, do nothing
    if (candidateChain === null) return

    // verify chain
    if (verifyChain(candidateChain) == false) {
      console.log("The candidate chain is not valid")
      return
    } 

    replaceChain(candidateChain)
  },


  // block injected
  [MessageTypes.BLOCK_INJECTED]: (peer: WebSocket, block: Block) => {
    const localHead = getHead()

    // if remote chain is higher than local chain more than 1 level,
    // request theirs
    if(block.header.level > localHead.header.level + 1) {
      const syncRequestMsg = createSyncRequestMsg(localHead.header)
      peer.send(syncRequestMsg)
      pauseMine()
    }

    // do nothing if remote head is lower than mine
    else if(block.header.level <= localHead.header.level) {
      return 
    }

    // otherwise, verify
    else if (verifyChain([block]) == false) {
      console.log("The new injected block is not valid")
      return
    } 

    processBlock(block)
    requestMine(getTxFromMempool())
  },

  [MessageTypes.TRANSACTION_INJECTED]: (peer: WebSocket, tx: Transaction) => {
    // TODO: validate
    pushToMempool(tx)
  },

  // send me your mempoolz
  [MessageTypes.MEMPOOL_REQUEST]: (peer: WebSocket) => {
    const mempoolResponse = createMempoolResponseMsg(getTxFromMempool())
    peer.send(mempoolResponse)
  },

  [MessageTypes.MEMPOOL_RESPONSE]: (peer: WebSocket, mempool: Mempool) => {
    mempool.forEach(tx => pushToMempool(tx))
  }

  // // what is your latest block?
  // [MessageTypes.HEAD_REQUEST]: (peer: WebSocket) => {
  //   const head = getHead()
  //   peer.send(head)
  // },

  // [MessageTypes.HEAD_RESPONSE]: (peer: WebSocket, remoteHead: Block) => {
  //   const localHead = getHead()

  //   const localLevel = localHead.header.level
  //   const remoteLevel = remoteHead.header.level

  //   // ignore if localHead is the latest
  //   if(localLevel >= remoteLevel) return

  //   // if level difference is only 1, push block & broadcast
  //   if(remoteLevel === localLevel + 1) {
  //     // block validation is done within pushBlock()
  //     pushBlock(remoteHead)

  //     // pushBlock can throw, so in case of error, codes below won't run
  //     const blockInjectedMessage = createBlockInjectedMsg(remoteHead)
  //     peers.forEach(peer => peer.send(blockInjectedMessage))
  //   }

  //   // if level difference is bigger than 1
  //   else {
  //     const blockchainRequestMesasge = createBlockchainRequestMsg(localHead.header)
  //     peers.forEach(peer => peer.send(blockchainRequestMesasge))
  //   }
  // },

  // // give me blockchain from n
  // [MessageTypes.BLOCKCHAIN_REQUEST]: (peer: WebSocket, remoteHeader: Block["header"]) => {

  //   // if remote level is highter than mine, send null
  //   const localHead = getHead()
  //   const remoteLevel = remoteHeader.level
  //   if (localHead.header.level <= remoteLevel) {
  //     const blockchainResponseMessage = createBlockchainResponseMsg(null)
  //     peer.send(blockchainResponseMessage)
  //     return
  //   }

  //   // remoteHead level and hash is not the same as local
  //   // it is not the same chain
  //   // send null
  //   const localChain = getBlockchain()
  //   const remoteHash = calculateBlockHash(remoteHeader)
  //   if (localChain[remoteHeader.level].hash !== remoteHash) {

  //     const nChainWork = getNChainWork()
  //     if()


  //     const blockchainResponseMessage = createBlockchainResponseMsg(null)
  //     peer.send(blockchainResponseMessage)
  //     return
  //   }

  //   // otherwise, send the chain difference
  //   const blockchain = getBlockchain()
  //   const chainDifference = blockchain.slice(remoteLevel + 1)
  //   const blockchainResponseMessage = createBlockchainResponseMsg(chainDifference)
  //   peer.send(blockchainResponseMessage)
  // },

  // [MessageTypes.BLOCKCHAIN_RESPONSE]: (peer: WebSocket, remoteChain: Blockchain) => {
  //   const localHead = getHead()
  //   const remoteHead = remoteChain[remoteChain.length - 1]

  //   if(remoteHead === null) return
  //   if(localHead.header.lev
// if(cluster.isMaster) {
//   initializeBlockchain(genesisTimestamp)
//   initializeNode(9732)
//   initializeMiner()

//   setTimeout(() => {
//     for(let i=0; i<3; i++) cluster.fork()
//   }, 5000)
// }

// else {
//   initializeBlockchain(genesisTimestamp)
//   initialiain)


  // }
  
}

const messageHandler = (peer: WebSocket) => {
  peer.on('message', (data: string) => {
    const parsed = JSON.parse(data)
    const { type, body } = parsed

    log(`[incoming] ${MessageTypeNames[type]}`)

    messageHandlers[type](peer, body)
  })
}

const log = (msg: string) => console.log(`${process.env.port}: ${msg}`)

export const broadcastNextBlock = (block: Block) => {
  const blockInjectedMessage = createBlockInjectedMsg(block)
  peers.forEach(peer => {
    peer.send(blockInjectedMessage)
  })

  // const nextBlock = createNewBlock([])
  // pushBlock(nextBlock)
  
}

export const broadcastTransaction = (tx: Transaction) => {
  const txInjectedMessage = createTxInjectedMsg(tx)
  peers.forEach(peer => {
    peer.send(txInjectedMessage)
  })
}