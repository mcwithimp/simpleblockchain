import {
  blockchain,
  createNewBlock,
  calculateBlockHash,
} from './blockchain'

test('blockchain should contain a genesis block', () => {
  expect(blockchain.length).toBe(1)
  console.log(blockchain)
})

test('blockchain should be superseded by another block', () => {
  blockchain.push(createNewBlock('Multicampus'))
  const genesis = blockchain[0]
  const head = blockchain[blockchain.length - 1]
  console.log(blockchain)
  expect(blockchain.length).toBe(2)
  expect(calculateBlockHash(genesis.header)).toBe(head.header.previousHash)
  expect(genesis.header.level).toBe(head.header.level - 1)
})

test('blockchain should be superseded by another block', () => {
    blockchain.push(createNewBlock('Tezos Korea'))

    const head = blockchain[blockchain.length - 1]
    const previous = blockchain[head.header.level - 1]

    console.log(blockchain)
    expect(blockchain.length).toBe(3)
    expect(calculateBlockHash(previous.header)).toBe(head.header.previousHash)
    expect(previous.header.level).toBe(head.header.level - 1)
})
