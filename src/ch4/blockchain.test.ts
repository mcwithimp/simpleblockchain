import { getBlockchain, createNewBlock, pushBlock, initialize, getHead } from "./blockchain"

initialize()

// let blockchain = getBlockchain()
// //console.log("genesis block")
// //console.log(JSON.stringify(blockchain, null, 2))

// //console.log("create the 1st block")
// const nextBlock = createNewBlock([])
// pushBlock(nextBlock)

// blockchain = getBlockchain()
// //console.log(JSON.stringify(blockchain, null, 2))

// //console.log('create the 2nd block')

// const nextBlock2 = createNewBlock([])
// pushBlock(nextBlock2)

// blockchain = getBlockchain()
// //console.log(JSON.stringify(blockchain, null, 2))

for(let i=0; i<120; i++) {
  const nb = createNewBlock([])
  pushBlock(nb)
}

console.log(getHead().header)

