import express from 'express'
import bodyParser from 'body-parser'
import { TransactionInput } from './types/transaction'

export const initialize = (port: number) => {
  const app = express()
  app.use(bodyParser.json())

  app.post('/tx', (req, res) => {
    const body: TransactionInput = req.body
    const { from, to, amount } = body

    const TxOut = {
      address: to,
      amount
    }
  })

  app.listen(port - 1000)
}

