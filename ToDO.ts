// // 0. 개요
// // 1. Block and blockchain
// // 2. Transaction
// // 3. Node (P2P)
// // 4. Miner (Consensus)
// // 5. Client

// blockchain is a data structure
// block
// blockchain

// mining in one server model
// nonce finding
// difficulty adjusting
// reward : coinbaseTx

// balance check 

// P2P

// TX

// const isBlockValid = (newBlock : Block, previousBlock: Block) => {
//   if (calculateBlockHash(previousBlock.header) !== block.header.previousHash) {
//   }
// }

// const isChainValid = (chain: Blockchian) => {
//   const peerGenesis = chain[0]
//   const myGenesis = genesis

//   if (JSON.stringify(peerGenesis) !== JSON.stringify(myGenesis)) {

//   }

//   chain.slice(1).every((cur, idx, arr) => {
//     return (
//       cur.level === idx && 
//       isBlockValid(cur, arr[idx -1])
//     )
//   })
// }


// interface Block {
//   header: {
//     nonce: number,
//     miner: string,
//     chain_id: string
//   },
//   transactions: Transaction[],
//   signature: string
// }

// type Blockchain = Block[]

// interface UTxO {
//   txOutId: string,
//   txOutIdx: number,
//   address: string,
//   amount: number
// }

// ///////////////////////////////
// // fixtures
// ///////////////////////////////
// const genesisBlock: Block = {
//   header: {
//     hash: 'genesis',
//     previousHash: '0',
//     nonce: 0xdeadbeef,
//     miner: 'genesisminer',
//     level: 0,
//     timestamp: new Date().getTime()
//   },
//   transactions: [],
//   signature: 'genesissignature'
// }

// const blocks: Blockchain = [genesisBlock]

// ///////////////////////////////
// // functions
// ///////////////////////////////

// function createBlock(
//   level: number,
//   previousHash: string,
//   signature: string,
//   transactions: Transaction[]
// ): Block {
//   return {
//     header: {
//       hash: 'asdf',
//       previousHash,
//       level,
//       nonce: 0xdeadbeef,
//       miner: 'asdf',
//       timestamp: new Date().getTime()
//     },
//     transactions,
//     signature
//   }
// }

// function injectBlock(
//   nextBlock: Block
// ): Blockchain {
//   blocks.push(nextBlock)
//   return blocks
// }

