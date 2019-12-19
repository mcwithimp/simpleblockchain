import cluster from 'cluster'
const workerId = cluster.worker ? cluster.worker.id : 0
export const log = (msg: string) => console.log(`${workerId}: ${msg}`)
