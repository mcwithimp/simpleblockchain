// // 1. 개요
// // 2. Block and blockchain
// // 3. Transaction
// // 4. Node
// // 5. Miner
// // 6. Client
// // 7. P2P(extension of network)

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

// interface TxIn {
//   txOutId: string,
//   txOutIdx: number,
//   signature: string
// }

// interface TxOut {
//   address: string,
//   amount: number
// }

// interface Transaction {
//   txIns: TxIn[],
//   txOuts: TxOut[],
// }

// type Mempool = Transaction[]

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

