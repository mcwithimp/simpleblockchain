import { getBlockchain, createNewBlock, pushBlock, initialize } from "./blockchain"

initialize()

let blockchain = getBlockchain()
console.log("genesis block")
console.log(JSON.stringify(blockchain, null, 2))

console.log("create the 1st block")
const nextBlock = createNewBlock([])
pushBlock(nextBlock)

blockchain = getBlockchain()
console.log(JSON.stringify(blockchain, null, 2))

console.log('create the 2nd block')

const nextBlock2 = createNewBlock([])
pushBlock(nextBlock2)

blockchain = getBlockchain()
console.log(JSON.stringify(blockchain, null, 2))

