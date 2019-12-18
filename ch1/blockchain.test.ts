import { getBlockchain, createNewBlock, pushBlock } from "./blockchain"

let blockchain = getBlockchain()
console.log("Genesis Block")
console.log(blockchain)


console.log("Create a New Block")
const nextBlock = createNewBlock([
  'test1',
  'test2'
])
pushBlock(nextBlock)

blockchain = getBlockchain()
console.log(blockchain)