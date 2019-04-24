import { getConnection } from 'typeorm'
import { Cell, OutPoint, Script } from './cells'
import InputEntity from '../entities/Input'
import OutputEntity from '../entities/Output'
import TransactionEntity from '../entities/Transaction'
import { getHistoryTransactions } from '../mock_rpc'
import ckbCore from '../core'

export interface Input {
  previousOutput: OutPoint
  args: string[]
  validSince?: number
}

export interface Witness {
  data: string[]
}

export interface Transaction {
  hash: string
  version: number
  deps?: OutPoint[]
  inputs?: Input[]
  outputs?: Cell[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: Witness[]
  type?: string
}

export interface TransactionsByAddressesParam {
  pageNo: number
  pageSize: number
  addresses: string[]
}

export interface TransactionsByLockHashesParam {
  pageNo: number
  pageSize: number
  lockHashes: string[]
}

export interface TransactionsByPubkeysParams {
  pageNo: number
  pageSize: number
  pubkeys: string[]
}

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

export interface TargetOutput {
  address: string
  capacity: string
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
export default class TransactionsService {
  public static getAll = async (params: TransactionsByLockHashesParam): Promise<PaginationResult<Transaction>> => {
    // TODO: calculate lockHashes when saving transactions
    const totalCount = await TransactionEntity.count()
    const connection = getConnection()
    const skip = (params.pageNo - 1) * params.pageSize
    const transactions = await connection
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .skip(skip)
      .take(params.pageSize)
      .getMany()

    const txs: Transaction[] = transactions!.map(tx => ({
      timestamp: tx.timestamp,
      value: tx.value,
      hash: tx.hash,
      version: tx.version,
      type: tx.type,
    }))

    return {
      totalCount: totalCount || 0,
      items: txs,
    }
  }

  public static getAllByAddresses = async (
    params: TransactionsByAddressesParam,
  ): Promise<PaginationResult<Transaction>> => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static getAllByPubkeys = async (
    params: TransactionsByPubkeysParams,
  ): Promise<PaginationResult<Transaction>> => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static get = async (hash: string): Promise<Transaction | undefined> => {
    const tx = await getConnection()
      .getRepository(TransactionEntity)
      .findOne(hash, { relations: ['inputs', 'outputs'] })

    if (!tx) {
      return undefined
    }

    const transaction: Transaction = {
      ...tx,
      inputs: tx.inputs.map(i => {
        return {
          ...i,
          previousOutput: i.previousOutput(),
        }
      }),
      outputs: tx.outputs.map(o => {
        return {
          ...o,
          outPoint: o.outPoint(),
        }
      }),
    }

    return transaction
  }

  // check whether the address has history transactions
  public static hasTransactions = (_address: string): boolean => {
    return Math.random() >= 0.5
  }

  public static create = async (transaction: Transaction): Promise<TransactionEntity> => {
    const tx = new TransactionEntity()
    tx.hash = transaction.hash
    tx.version = transaction.version
    tx.deps = transaction.deps!
    tx.timestamp = transaction.timestamp!
    tx.value = transaction.value!
    tx.blockHash = transaction.blockHash!
    tx.blockNumber = transaction.blockNumber!
    tx.witnesses = transaction.witnesses!
    tx.type = transaction.type!
    tx.inputs = []
    tx.outputs = []
    await getConnection().manager.save(tx)
    await transaction.inputs!.forEach(async i => {
      const input = new InputEntity()
      input.outPointHash = i.previousOutput.hash
      input.outPointIndex = i.previousOutput.index
      input.args = i.args
      input.transaction = tx
      await getConnection().manager.save(input)
    })
    await transaction.outputs!.forEach(async (o, index) => {
      const output = new OutputEntity()
      output.outPointHash = transaction.hash
      output.outPointIndex = index
      output.capacity = o.capacity
      output.data = o.data!
      output.lock = o.lock
      output.type = o.type!
      output.lockHash = o.lockHash!
      output.transaction = tx
      await getConnection().manager.save(output)
    })

    return tx
  }

  /* eslint no-await-in-loop: "warn" */
  // NO parallel
  public static loadTransactionsHistoryFromChain = async (lockHashes: string[]) => {
    // TODO: to => get_tip_block_number
    const to = 1000
    let currentFrom = 0
    let currentTo = to
    while (currentFrom <= to) {
      currentTo = Math.min(currentFrom + 100, to)
      const txs = await getHistoryTransactions(lockHashes, currentFrom.toString(), currentTo.toString())
      await TransactionsService.convertTransactions(txs)
      currentFrom = currentTo + 1
    }
  }

  public static convertTransactions = async (transactions: Transaction[]): Promise<TransactionEntity[]> => {
    const txEntities: TransactionEntity[] = []

    transactions.forEach(async tx => {
      const txEntity = await TransactionsService.convertTransactionAndCreate(tx)
      txEntities.push(txEntity)
    })

    return txEntities
  }

  public static convertTransactionAndCreate = async (transaction: Transaction): Promise<TransactionEntity> => {
    const tx: Transaction = transaction
    // TODO: calculate value, sum of not return charge output
    tx.value = Math.round(Math.random() * 10000).toString()
    tx.type = ['send', 'receive', 'unknown'][Math.round(Math.random() * 2)]
    tx.outputs = tx.outputs!.map(o => {
      const output = o
      output.lockHash = TransactionsService.lockScriptToHash(output.lock!)
      return output
    })
    const txEntity = await TransactionsService.create(transaction)
    return txEntity
  }

  public static generateTx = async (_lockHashes: string[], _targetOutputs: TargetOutput[]) => {
    const inputs: Input[] = [
      {
        previousOutput: {
          hash: '0xb2becaa4e71e43abc75d1a87280b63df4dceaae1716540faf65e38925d2f641d',
          index: 0,
        },
        args: [],
        validSince: 0,
      },
    ]

    const outputs = [
      {
        capacity: '1000',
        data: '',
        lock: {
          binary_hash: '0x8bddddc3ae2e09c13106634d012525aa32fc47736456dba11514d352845e561d',
          args: [
            '0x65323139336466353164373834313136303137393662333562313762346638663263643835626430616461383834326166323365303836633136396133316432',
          ],
        },
      },
      {
        capacity: '49000',
        data: '',
        lock: {
          binary_hash: '0x8bddddc3ae2e09c13106634d012525aa32fc47736456dba11514d352845e561d',
          args: [
            '0x33366333323965643633306436636537353037313261343737353433363732616461623537663463366664333661373134393633303534353662623239386462',
          ],
        },
      },
    ]

    return {
      version: 0,
      deps: [
        {
          hash: '0x8d37f0856ebb70c12871830667d82224e6619896c7f12bb73a14dd9329af9c8d',
          index: 0,
        },
      ],
      inputs,
      outputs,
    }
  }

  // use SDK lockScriptToHash
  public static lockScriptToHash = (lock: Script) => {
    const binaryHash: string = lock!.binaryHash!
    const args: Uint8Array[] = lock.args!.map(n => {
      return ckbCore.utils.hexToBytes(n)
    })
    return ckbCore.utils.lockScriptToHash({
      binaryHash,
      args,
    })
  }

  // continue to loop blocks to latest block
  public static loopBlocks = async () => {
    const tipBlockNumber: number = await ckbCore.rpc.getTipBlockNumber()
    // TODO: should load currentBlockNumber from local
    const currentBlockNumber = 0
    for (let i = currentBlockNumber; i <= tipBlockNumber; ++i) {
      // TODO: check fork
      const blockHash: string = await ckbCore.rpc.getBlockHash(i)
      const block = await ckbCore.rpc.getBlock(blockHash)
      await TransactionsService.resolveBlock(block)
    }
  }

  // resolve block
  public static resolveBlock = async (block: CKBComponents.Block) => {
    const transactions: Transaction[] = block.commitTransactions.map(t => {
      const inputs: Input[] = t.inputs.map(i => {
        const args = i.args.map(a => ckbCore.utils.bytesToHex(a))
        const previousOutput = i.prevOutput
        const ii: Input = {
          previousOutput,
          args,
        }
        return ii
      })

      const outputs: Cell[] = t.outputs.map(o => {
        let type
        if (o.type) {
          type = {
            binaryHash: o.type.binaryHash,
            args: o.type.args.map(ckbCore.utils.bytesToHex),
          }
        }
        return {
          ...o,
          data: ckbCore.utils.bytesToHex(o.data),
          capacity: o.capacity.toString(),
          lock: {
            binaryHash: o.lock.binaryHash,
            args: o.lock.args.map(ckbCore.utils.bytesToHex),
          },
          type,
        }
      })

      const tx = {
        ...t,
        inputs,
        outputs,
      }

      return tx
    })
    TransactionsService.resolveTxs(transactions)
  }

  // resolve transactions
  public static resolveTxs = async (transactions: Transaction[]) => {
    await transactions.forEach(async tx => {
      await TransactionsService.resolveTx(tx)
    })
  }

  // resolve single transaction
  public static resolveTx = async (transaction: Transaction) => {
    if (TransactionsService.anyOutput(transaction.outputs!) || TransactionsService.anyInput(transaction.inputs!)) {
      TransactionsService.create(transaction)
    }
  }

  public static anyOutput = (outputs: Cell[]): boolean => {
    return !!outputs.find(output => {
      return TransactionsService.checkLockScript(output.lock!)
    })
  }

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "warn" */
  public static anyInput = async (inputs: Input[]): Promise<boolean> => {
    for (const input of inputs) {
      const outPoint: OutPoint = input.previousOutput
      const output = await getConnection()
        .getRepository(InputEntity)
        .findOne({
          outPointHash: outPoint.hash,
          outPointIndex: outPoint.index,
        })
      if (output) {
        return true
      }
    }

    return false
  }

  // is this lockScript belongs to me
  public static checkLockScript = (lock: Script): boolean => {
    const lockHash = TransactionsService.lockScriptToHash(lock)
    return TransactionsService.checkLockHash(lockHash)
  }

  // is this lockHash belongs to me
  public static checkLockHash = (lockHash: string): boolean => {
    return parseInt(lockHash[lockHash.length - 1], 16) % 2 === 0
  }
}
