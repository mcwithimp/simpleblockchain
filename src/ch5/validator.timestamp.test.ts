import { createNewBlock, pushBlock, getHead, initialize, getBlockchain } from "./blockchain"
import { getTimestamp, verifyTimestamp } from "./validator"
import { BLOCK_INTERVAL } from './constants.json'

initialize()
for (let i = 0; i < 12; i++) {
  const nb = createNewBlock([])
  pushBlock(nb)
}

console.log(getHead().header)

const left = getBlockchain()[13- 11].header.timestamp
const right = getBlockchain()[13 - 1].header.timestamp
const lowerBound = Math.floor((left + right) / 2)
const upperBound = getTimestamp() + (BLOCK_INTERVAL * 12)

console.log({ lowerBound, upperBound })
const newTimestamp = getTimestamp()
const test1 = verifyTimestamp(13, newTimestamp - 50)
const test2 = verifyTimestamp(13, newTimestamp - 10)
const test3 = verifyTimestamp(13, newTimestamp)
const test4 = verifyTimestamp(13, newTimestamp + 10)
const test5 = verifyTimestamp(13, newTimestamp + 30)
const test6 = verifyTimestamp(13, newTimestamp + 50)

console.log(newTimestamp - 50, { test1 })
console.log(newTimestamp - 10, { test2 })
console.log(newTimestamp, { test3 })
console.log(newTimestamp + 10, { test4 })
console.log(newTimestamp + 30, { test5 })
console.log(newTimestamp + 50, { test6 })