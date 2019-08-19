import { remote } from 'electron'
import AddressService from 'services/addresses'
import LockUtils from 'models/lock-utils'
import IndexerQueue, { LockHashInfo } from 'services/indexer/queue'
import { Address } from 'database/address/dao'

import { initDatabase } from './init-database'

const { nodeService, addressDbChangedSubject, walletCreatedSubject } = remote.require(
  './startup/sync-block-task/params'
)

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
export const loadAddressesAndConvert = async (): Promise<LockHashInfo[]> => {
  const addresses: Address[] = await AddressService.allAddresses()
  const lockHashInfos: LockHashInfo[][] = await Promise.all(
    addresses.map(async address => {
      const lockHashes: string[] = await LockUtils.addressToAllLockHashes(address.address)
      const infos = lockHashes.map(lockHash => {
        return {
          lockHash,
          isImport: address.isImport,
        }
      })
      return infos
    })
  )
  return lockHashInfos.reduce((acc, val) => acc.concat(val), [])
}

// call this after network switched
let indexerQueue: IndexerQueue | undefined
export const switchNetwork = async (nodeURL: string) => {
  // stop all blocks service
  if (indexerQueue) {
    await indexerQueue.stopAndWait()
  }

  // disconnect old connection and connect to new database
  await initDatabase()
  // load lockHashes
  const lockHashInfos: LockHashInfo[] = await loadAddressesAndConvert()
  // if network switched, the lockHashes should all be import(not create), it will index from 0
  const lockHashInfosWithImport: LockHashInfo[] = lockHashInfos.map(info => {
    return {
      lockHash: info.lockHash,
      isImport: true,
    }
  })
  // start sync blocks service
  indexerQueue = new IndexerQueue(nodeURL, lockHashInfosWithImport, nodeService.tipNumberSubject)

  addressDbChangedSubject.subscribe(async (event: string) => {
    // ignore update and remove
    if (event === 'AfterInsert') {
      const infos: LockHashInfo[] = await loadAddressesAndConvert()
      if (indexerQueue) {
        indexerQueue.setLockHashInfos(infos)
      }
    }
  })

  walletCreatedSubject.subscribe(async (type: string) => {
    if (type === 'import') {
      if (indexerQueue) {
        indexerQueue.reset()
      }
    }
  })

  indexerQueue.start()
  indexerQueue.processFork()
}
