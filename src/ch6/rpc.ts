import express from 'express'
import bodyParser from 'body-parser'
import { TransactionInput } from './types/transaction'
import { transfer } from './transaction'
import { pushToMempool } from './blockchain'
import { log } from '../lib/log'
import { broadcastTransaction } from './node'
import { verifyAddress } from '../lib/crypto'

export const initialize = (port: number) => {
  const app = express()
  app.use(bodyParser.json())

  app.post('/tx', (req, res) => {
    const body: TransactionInput = req.body
    const { from, to, amount } = body

    if (verifyAddress(from) == false) {
      console.log('Source address is not valid!')
      return
    }

    if (verifyAddress(to) == false) {
      console.log('Destination address is not valid!')
      return
    }

    const transaction = transfer(from, to, amount)
    pushToMempool(transaction)
    broadcastTransaction(transaction)

    res.send(transaction)
  })

  app.listen(port - 1000, () => {[
    log(`rpc running at port ${port-1000}`)
  ]})
}

