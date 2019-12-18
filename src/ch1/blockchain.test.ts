import { getBlockchain, createNewBlock, pushBlock } from "./blockchain"

let blockchain = getBlockchain()
console.log("genesis block")
console.log(blockchain)

console.log("create the 1st block")
const nextBlock = createNewBlock([
  'test1',
  'test2'
])
pushBlock(nextBlock)

blockchain = getBlockchain()
console.log(blockchain)


console.log('create the 2nd block')

const nextBlock2 = createNewBlock([
  'test22222',
  'test333333333333332'
])
pushBlock(nextBlock2)

blockchain = getBlockchain()
console.log(blockchain)