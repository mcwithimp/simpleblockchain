import { createNewBlock, pushBlock, updateContext, initialize, getHeadContext, getHead } from "./blockchain"

initialize()

let utxo = getHeadContext()
const genesisblock = getHead()
console.log("genesis block")
console.log(genesisblock)
console.log(utxo)

console.log("create the 1st block")
const nextBlock = createNewBlock([])
console.log(JSON.stringify(nextBlock, null, 2))
pushBlock(nextBlock)
updateContext(nextBlock)

utxo = getHeadContext()
console.log(utxo)

console.log('create the 2nd block')

const nextBlock2 = createNewBlock([])
console.log(JSON.stringify(nextBlock2, null, 2))
pushBlock(nextBlock2)
updateContext(nextBlock2)

utxo = getHeadContext()
console.log(JSON.stringify(utxo, null, 2))

