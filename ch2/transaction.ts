import { Transaction } from './types/types'
import { sha256 } from './crypto'

export const calculateTxHash = (tx: Transaction): string => sha256(JSON.stringify(tx))