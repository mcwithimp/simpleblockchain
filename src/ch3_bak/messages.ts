import { Block } from "../ch1/types/block"

export enum MessageTypes {
  PEER_SYNC,
  BLOCK_SYNC,
  BLOCK_REORG_REQUEST,
  BLOCK_REORG_RESPONSE
}

export interface Message<PayloadType> {
  type: MessageTypes,
  data: PayloadType
}

export const createPeerSyncMessage = (
  peers: string[]
): Message<string[]> => ({
  type: MessageTypes.PEER_SYNC,
  data: peers
})

export const createBlocSyncMessage = (
  block: Block
): Message<Block> => ({
  type: MessageTypes.BLOCK_SYNC,
  data: block
})

export const createBlockReorgRequestMessage = (
  lb: number,
  ub: number
): Message<[number, number]> => ({
  type: MessageTypes.BLOCK_REORG_REQUEST,
  data: [lb, ub]
})

export const createBlockReorgResponseMessage = (
  blocks: Block[]
): Message<Block[]> => ({
  type: MessageTypes.BLOCK_REORG_RESPONSE,
  data: blocks
})