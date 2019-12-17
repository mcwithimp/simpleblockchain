import WebSocket, { Server as WebSocketServer } from 'ws'
import { Block, Blockchain } from '../ch1/types/types'
import { Message, MessageTypes, createBlockReorgResponseMessage } from './messages'

interface Dependencies {
  getBlockchain: () => Blockchain,
  resetBlockchain: () => void,
  pushBlock: (block: Block) => void,
  requestMine: (whatever: any) => void,
  minConnections: number,
  bootstrapPeers: string[]
}

enum State {
  NOT_INITIALIZED,
  INITIALIZED
}

export default function node({
  getBlockchain,
  resetBlockchain,
  pushBlock,
  requestMine,
  minConnections,
  bootstrapPeers
}: Dependencies): WebSocketServer {
  const blockchain = getBlockchain()
  const localHeadLevel = blockchain[blockchain.length - 1].header.level

  let state: State = State.NOT_INITIALIZED

  // peers list
  const peerConnections: Set<WebSocket> = new Set()

  // create wss
  const server = new WebSocketServer({ port: 8080 })

  // onMessage
  const messageHandlers: {
    [key in MessageTypes]: (peer: WebSocket, data: any) => void
  } = {
    // when peer is synchronized, connect to them
    [MessageTypes.PEER_SYNC](_, peers: string[]) {
      peers.map(peerAddress => {
        const peer = new WebSocket(`ws://${peerAddress}`)
        peer.on('open', () => {
          onPeerConnection(peerConnections, peer, onMessage)
        })
      })
    },

    // when a block is synced, push the block
    [MessageTypes.BLOCK_SYNC](_, block: Block) {
      pushBlock(block)
    },

    // when a block reorg request is received,
    // send all blocks 
    [MessageTypes.BLOCK_REORG_REQUEST](peer, [lb, ub]: [number, number]) {
      const blockchain = getBlockchain()
      const sliced = blockchain.slice(lb, ub-lb)
      const response = createBlockReorgResponseMessage(sliced)

      peer.send(response)
    },
    [MessageTypes.BLOCK_REORG_RESPONSE](peer, blocks: Block[]) {
      const blockchain = getBlockchain()
      const start = blocks[0].header.level
      const nextBlockchain = [...blockchain.slice(0, start), ...blocks]

      resetBlockchain()
      nextBlockchain.forEach(block => pushBlock(block))
    }
  }
  const onMessage = (peer: WebSocket, data: Message<any>) => messageHandlers[data.type](peer, data.data)

  // make ws connection to bootstrap peers
  bootstrapPeers.map(peerAddress => {
    const peer = new WebSocket(`ws://${peerAddress}`)
    peer.on('open', () => {
      onPeerConnection(peerConnections, peer, onMessage)
    })
  })

  // wait for incoming peer connection, 
  server.on('connection', peer => {
    onPeerConnection(peerConnections, peer, onMessage)
  })

  return server
}

function onPeerConnection(
  peerConnections: Set<WebSocket>,
  peer: WebSocket,
  onMessage: (peer: WebSocket, data: Message<any>) => void
) {
  peerConnections.add(peer)

  // remove from peers list when ws closes
  peer.on('close', () => peerConnections.add(peer))

  // on message delivery
  peer.on('message', data => onMessage(peer, JSON.parse(data.toString())))

  // return peer
  return peer
}
