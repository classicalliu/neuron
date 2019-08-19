import { Not, In } from 'typeorm'
import { AddressType } from 'models/keys/address'
import { TransactionsService } from 'services/tx'
import CellsService from 'services/cells'
import LockUtils from 'models/lock-utils'
import { TransactionStatus } from 'types/cell-types'
import { OutputStatus } from 'services/tx/params'
import AddressEntity, { AddressVersion } from './entities/address'
import { getConnection } from './ormconfig'

export interface Address {
  walletId: string
  address: string
  path: string
  addressType: AddressType
  addressIndex: number
  txCount: number
  liveBalance: string
  sentBalance: string
  pendingBalance: string
  balance: string
  blake160: string
  version: AddressVersion
  description?: string
  isImport: boolean
}

export default class AddressDao {
  public static create = async (addresses: Address[]): Promise<AddressEntity[]> => {
    const addressEntities: AddressEntity[] = addresses.map(address => {
      const addressEntity = new AddressEntity()
      addressEntity.walletId = address.walletId
      addressEntity.address = address.address
      addressEntity.path = address.path
      addressEntity.addressType = address.addressType
      addressEntity.addressIndex = address.addressIndex
      addressEntity.txCount = address.txCount || 0
      addressEntity.blake160 = address.blake160
      addressEntity.version = address.version
      addressEntity.liveBalance = address.liveBalance || '0'
      addressEntity.sentBalance = address.sentBalance || '0'
      addressEntity.pendingBalance = address.pendingBalance || '0'
      addressEntity.isImport = address.isImport
      return addressEntity
    })

    return getConnection().manager.save(addressEntities)
  }

  // txCount include all txs in db
  // liveBalance means balance of OutputStatus.Live cells (already in chain and not spent)
  // sentBalance means balance of OutputStatus.Sent cells (sent to me but not committed)
  // pendingBalance means balance of OutputStatus.Pending cells (sent from me, but not committed)
  // so the final balance is (liveBalance + sentBalance - pendingBalance)
  public static updateTxCountAndBalance = async (address: string): Promise<AddressEntity[]> => {
    const addressEntities = await getConnection()
      .getRepository(AddressEntity)
      .find({
        address,
      })

    const txCount: number = await TransactionsService.getCountByAddressAndStatus(address, [
      TransactionStatus.Pending,
      TransactionStatus.Success,
    ])
    const entities = await Promise.all(
      addressEntities.map(async entity => {
        const addressEntity = entity
        addressEntity.txCount = txCount
        const lockHashes: string[] = await LockUtils.addressToAllLockHashes(addressEntity.address)
        addressEntity.liveBalance = await CellsService.getBalance(lockHashes, OutputStatus.Live)
        addressEntity.sentBalance = await CellsService.getBalance(lockHashes, OutputStatus.Sent)
        addressEntity.pendingBalance = await CellsService.getBalance(lockHashes, OutputStatus.Pending)
        return addressEntity
      })
    )

    return getConnection().manager.save(entities)
  }

  public static nextUnusedAddress = async (
    walletId: string,
    version: AddressVersion
  ): Promise<AddressEntity | undefined> => {
    const addressEntity = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
        version,
        addressType: AddressType.Receiving,
        txCount: 0,
      })
      .orderBy('address.addressIndex', 'ASC')
      .getOne()

    return addressEntity
  }

  public static nextUnusedChangeAddress = async (
    walletId: string,
    version: AddressVersion
  ): Promise<AddressEntity | undefined> => {
    const addressEntity = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
        version,
        addressType: AddressType.Change,
        txCount: 0,
      })
      .orderBy('address.addressIndex', 'ASC')
      .getOne()

    return addressEntity
  }

  public static allAddresses = async (version: AddressVersion): Promise<AddressEntity[]> => {
    const addressEntities = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        version,
      })
      .getMany()

    return addressEntities
  }

  public static allAddressesByWalletId = async (
    walletId: string,
    version: AddressVersion
  ): Promise<AddressEntity[]> => {
    const addressEntities = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
        version,
      })
      .getMany()

    return addressEntities
  }

  public static usedAddressesByWalletId = async (
    walletId: string,
    version: AddressVersion
  ): Promise<AddressEntity[]> => {
    const addressEntities = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
        version,
        txCount: Not(0),
      })
      .getMany()

    return addressEntities
  }

  public static findByAddress = async (address: string, walletId: string): Promise<AddressEntity | undefined> => {
    const addressEntity = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        address,
        walletId,
      })
      .getOne()

    return addressEntity
  }

  public static findByAddresses = async (addresses: string[]) => {
    const addressEntities = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        address: In(addresses),
      })
      .getMany()
    return addressEntities
  }

  public static maxAddressIndex = async (
    walletId: string,
    addressType: AddressType,
    version: AddressVersion
  ): Promise<AddressEntity | undefined> => {
    const addressEntity = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
        addressType,
        version,
      })
      .orderBy('address.addressIndex', 'DESC')
      .getOne()

    if (!addressEntity) {
      return undefined
    }

    return addressEntity
  }

  public static updateDescription = async (walletId: string, address: string, description: string) => {
    const addressEntity = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
        address,
      })
      .getOne()

    if (!addressEntity) {
      return undefined
    }
    addressEntity.description = description
    return getConnection().manager.save(addressEntity)
  }

  public static deleteByWalletId = async (walletId: string) => {
    const addresses = await getConnection()
      .getRepository(AddressEntity)
      .createQueryBuilder('address')
      .where({
        walletId,
      })
      .getMany()
    return getConnection().manager.remove(addresses)
  }
}
