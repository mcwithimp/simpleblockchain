import { createNewBlock, pushBlock, initialize, getHead } from "./blockchain"

initialize()

for (let i = 0; i < 120; i++) {
  const nb = createNewBlock([])
  pushBlock(nb)

  console.log({
    nonce: nb.header.nonce
  })
}

console.log(getHead().header)