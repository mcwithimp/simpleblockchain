import { Block, Blockchain } from "./block"
import { Transaction } from "./transaction"

export interface Message {
  type: MessageTypes,
  body: string // json string
}

export const MessageTypeNames = [
  'PEER_REQUEST',
  'PEER_RESPONSE',
  'SYNC_REQUEST',
  'SYNC_RESPONSE',
  'BLOCK_INJECTED',
  'TRANSACTION_INJECTED',
  'MEMPOOL_REQUEST',
  'MEMPOOL_RESPONSE'
]

export enum MessageTypes {
  // peer discovery & management
  PEER_REQUEST,
  PEER_RESPONSE,

  // here is my header, can you all share your blockchain?
  SYNC_REQUEST,
  SYNC_RESPONSE,

  // // what is your latest block?
  // HEAD_REQUEST,
  // HEAD_RESPONSE,

  // // give me blockchain from n to m
  // BLOCKCHAIN_REQUEST,
  // BLOCKCHAIN_RESPONSE,

  // p2p broadcasting
  BLOCK_INJECTED,
  TRANSACTION_INJECTED,

  // give me your unprocessed txs
  MEMPOOL_REQUEST,
  MEMPOOL_RESPONSE
}

export const createPeerRequestMsg = (ip: string, port: number) => JSON.stringify({
  type: MessageTypes.PEER_REQUEST,
  body: { ip, port }
})

export const createPeerResponseMsg = (peers: string[]) => JSON.stringify({
  type: MessageTypes.PEER_RESPONSE,
  body: peers
})

export const createSyncRequestMsg = (remoteHeader: Block["header"]) => JSON.stringify({
  type: MessageTypes.SYNC_REQUEST,
  body: remoteHeader
})

export const createSyncResponseMsg = (blockchain: Blockchain | null) => JSON.stringify({
  type: MessageTypes.SYNC_RESPONSE,
  body: blockchain
})


// export const createBlockchainRequestMsg = (localHeader: Block["header"]) => ({
//   type: MessageTypes.BLOCKCHAIN_REQUEST,
//   body: localHeader
// })

// export const createBlockchainResponseMsg = (blockchain: Blockchain | null) => ({
//   type: MessageTypes.BLOCKCHAIN_RESPONSE,
//   body: blockchain
// })



export const createBlockInjectedMsg = (block: Block) => JSON.stringify({
  type: MessageTypes.BLOCK_INJECTED,
  body: block
})

export const createTxInjectedMsg = (tx: Transaction) => JSON.stringify({
  type: MessageTypes.TRANSACTION_INJECTED,
  body: tx
})