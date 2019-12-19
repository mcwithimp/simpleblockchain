import { initialize as initializeBlockchain, getTimestamp } from "./blockchain"
import { initialize as initializeMiner } from './miner'

const genesisTimestamp = getTimestamp()

initializeBlockchain(genesisTimestamp)
initializeMiner()

