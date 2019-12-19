import WebSocket, { Server as WebSocketServer } from 'ws'
import express from 'express'

import { BOOTSTRAP_PEERS, FINALITY_THRESHOLD } from './constants.json'
import {
  MessageTypes,
  createPeerRequestMsg,
  createSyncResponseMsg,
  createSyncRequestMsg,
  createPeerResponseMsg,
  createBlockInjectedMsg
} from './types/messages'
import { getHead, getBlockchain, replaceChain, pushBlock, createNewBlock } from './blockchain'
import { Block, Blockchain } from './types/block'
import { verifyChain } from './verifier.js'

const peers: Map<string, WebSocket> = new Map()

export const initialize = () => {
  const server = new WebSocketServer({ port: +process.env.port })
  server.on('connection', (ws, req) => {
    log(`hi~ ${req.connection.remoteAddress}:${req.connection.localPort}`)

    ws.on('close', () => {
      log(`peer ${ws.url} closed`)
      peers.delete(ws.url)
    })

    ws.on('error', () => {
      log(`peer ${ws.url} errored`)
      peers.delete(ws.url)
    })

    messageHandler(ws)
  })

  log('running')

  BOOTSTRAP_PEERS.map(connectToPeer)
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
    if (verifyChain(candidateChain)) 

    replaceChain(candidateChain)
  },


  // block injected
  [MessageTypes.BLOCK_INJECTED]: (peer: WebSocket, block: Block) => {
    pushBlock(block)
    createNewBlock([])
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
  //   if(localHead.header.level >= remoteHead.header.level) return

  //   syncBlockchain(remoteChain)


  // }
  
}

const messageHandler = (peer: WebSocket) => {
  peer.on('message', (data: string) => {
    const parsed = JSON.parse(data)
    const { type, body } = parsed

    log(`[incoming] ${type}, ${JSON.stringify(body, null, 2)}`)

    messageHandlers[type](peer, body)
  })
}

const log = (msg: string) => console.log(`${process.env.port}: ${msg}`)

export const broadcastNextBlock = (block: Block) => {
  peers.forEach(peer => {
    const blockInjectedMessage = createBlockInjectedMsg(block)
    peer.send(blockInjectedMessage)
  })

  // const nextBlock = createNewBlock([])
  // pushBlock(nextBlock)
  
}