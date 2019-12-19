import { initialize as initializeBlockchain } from './blockchain'
import { initialize as initializeNode } from './node'
import { initialize as initializeMiner } from './miner'

const genesisTimestamp = 1576747723
const port = +process.env.port

initializeBlockchain(genesisTimestamp)
initializeNode(port)
initializeMiner()

// if(cluster.isMaster) {
//   initializeBlockchain(genesisTimestamp)
//   initializeNode(9732)
//   initializeMiner()

//   setTimeout(() => {
//     for(let i=0; i<3; i++) cluster.fork()
//   }, 5000)
// }

// else {
//   initializeBlockchain(genesisTimestamp)
//   initializeNode(cluster.worker.id + 9733)
//   initializeMiner()
// }
