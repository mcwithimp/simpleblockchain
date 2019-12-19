import { initialize as initializeBlockchain } from './blockchain'
import { initialize as initializeNode } from './node'
import { initialize as initializeMiner } from './miner'

initializeBlockchain()
initializeNode()
initializeMiner()