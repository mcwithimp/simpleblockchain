import { Block, Blockchain, Transaction, Keys } from './types/types'
import { getHead, calculateBlockHash } from './blockchain'
import { sha256, sign } from './crypto'
import * as constants from './constants.json'
import path from 'path'

// miner 실행 시 인자로 주소 또는 alias를 받고 키 import
// const keypath = path.resolve(__dirname, './client/keys.json')
const minerKeys = {
  "alias": "myKeys1",
  "sk": "110efe13c20b8278881fc366f64e695c6880f67a37f75eabd3fea2e7f9b6f342",
  "pk": "04f6ccb16803516a2e5c9bbf12dcea1a802e55e51c04b915142c25c2336cf7a428a1f3cae1854a722435aa7004f517ede361e9f940f54ce091fe3273a497aa6170",
  "pkh": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX"
}
const { COINBASE_AMOUNT, SATOSHI } = constants

export const getTimestamp = () => parseInt((new Date().getTime() / 1000).toString(), 10)

const createCoinbaseTx = (minerKeys: Keys) : Transaction => {
  const txIns = [{
    txOutId: '0'.repeat(64),
    txOutIdx: 0
  }]
  const txOuts = [{
    address: minerKeys.pkh,
    amount: COINBASE_AMOUNT * SATOSHI
  }]

  const txId = sha256(JSON.stringify({txIns, txOuts}))
  const signature = sign(minerKeys.sk, txId)

  return {
    txId,
    txIns, 
    txOuts,
    signature
  }
}

// 로컬로 실행한 뒤 키 정보는 삭제
const genesisKeys = {
  "alias": "myKeys1",
  "sk": "110efe13c20b8278881fc366f64e695c6880f67a37f75eabd3fea2e7f9b6f342",
  "pk": "04f6ccb16803516a2e5c9bbf12dcea1a802e55e51c04b915142c25c2336cf7a428a1f3cae1854a722435aa7004f517ede361e9f940f54ce091fe3273a497aa6170",
  "pkh": "1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX"
}
export const genesisCoinbaseTx = createCoinbaseTx(genesisKeys)
console.log(genesisCoinbaseTx)
// export const genesisCoinbaseTx = {
//   txIns: [
//     {
//       txOutId: '0000000000000000000000000000000000000000000000000000000000000000',
//       txOutIdx: 0
//     }
//   ],
//   txOuts: [
//     {
//       address: '1LpUToTfVj6LVkwpyUnrFEXr3sNcdtRPkX',
//       amount: 5000000000
//     }
//   ],
//   signature: '3046022100aba21e2e3dd632914d54217083a61f72be08928b23c0ed54ffac74ee81fe3d2a022100f79b150793b6babe369616e31ec036ce978a89945e28375f9eda46123e63aafc'
// }

export const createNewBlock = (transactions: Transaction[]): Block => {
  const head = getHead()
  const header = {
    level: head.header.level + 1,
    previousHash: calculateBlockHash(head.header),
    timestamp: getTimestamp(),
    miner: minerKeys.pkh,
    txsHash: sha256(JSON.stringify(transactions))
  }
  const hash = calculateBlockHash(header)

  return {
    hash,
    header,
    transactions
  }
}