import { initialize as initializeBlockchain } from './blockchain'
import { initialize as initializeNode } from './node'
import { initialize as initializeMiner } from './miner'
import cluster from 'cluster'

const genesisTimestamp = +process.env.GENESIS_TIMESTAMP

if(cluster.isMaster) {
  initializeBlockchain(genesisTimestamp)
  initializeNode(9732)
  initializeMiner()

  setTimeout(() => {
    for(let i=0; i<3; i++) cluster.fork()
  }, 5000)
}

else {
  initializeBlockchain(genesisTimestamp)
  initializeNode(cluster.worker.id + 9733)
  initializeMiner()
}
