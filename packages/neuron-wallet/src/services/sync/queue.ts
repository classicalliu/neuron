import { Block, BlockHeader } from 'types/cell-types'
import { TransactionPersistor } from 'services/tx'
import logger from 'utils/logger'

import GetBlocks from './get-blocks'
import RangeForCheck, { CheckResultType } from './range-for-check'
import BlockNumber from './block-number'
import Utils from './utils'
import SimpleQueue from './simple-queue'

export default class Queue {
  private q: SimpleQueue
  private lockHashes: string[]
  private getBlocksService: GetBlocks
  private startBlockNumber: bigint
  private endBlockNumber: bigint
  private rangeForCheck: RangeForCheck
  private currentBlockNumber: BlockNumber

  private fetchSize: number = 4
  private retryTime: number = 5

  constructor(
    lockHashes: string[],
    startBlockNumber: string,
    endBlockNumber: string,
    currentBlockNumber: BlockNumber = new BlockNumber(),
    rangeForCheck: RangeForCheck = new RangeForCheck()
  ) {
    this.q = new SimpleQueue(this.getWorker())
    this.lockHashes = lockHashes
    this.getBlocksService = new GetBlocks()
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)
    this.rangeForCheck = rangeForCheck
    this.currentBlockNumber = currentBlockNumber
  }

  public setLockHashes = (lockHashes: string[]): void => {
    this.lockHashes = lockHashes
  }

  private getWorker = () => {
    const worker = async (task: any) => {
      try {
        await Utils.retry(this.retryTime, 0, async () => {
          await this.pipeline(task.blockNumbers)
        })
      } catch {
        this.clear()
      }
    }
    return worker
  }

  public clear = () => {
    this.q.clear()
  }

  public get = () => {
    return this.q
  }

  public length = (): number => {
    return this.q.length()
  }

  public kill = () => {
    this.q.kill()
  }

  public pipeline = async (blockNumbers: string[]) => {
    // 1. get blocks
    const blocks: Block[] = await this.getBlocksService.getRangeBlocks(blockNumbers)
    const blockHeaders: BlockHeader[] = blocks.map(block => block.header)

    // 2. check blockHeaders
    const checkResult = await this.checkBlockHeader(blockHeaders)

    if (checkResult.type === CheckResultType.FirstNotMatch) {
      return
    }

    // 3. check and save
    await this.getBlocksService.checkAndSave(blocks, this.lockHashes)

    // 4. update currentBlockNumber
    const lastBlock = blocks[blocks.length - 1]
    await this.currentBlockNumber.updateCurrent(BigInt(lastBlock.header.number))

    // 5. update range
    this.rangeForCheck.pushRange(blockHeaders)
  }

  public checkBlockHeader = async (blockHeaders: BlockHeader[]) => {
    const checkResult = this.rangeForCheck.check(blockHeaders)
    logger.info(`checkBlockHeader: ${checkResult.success} ${checkResult.type}`)
    if (!checkResult.success) {
      if (checkResult.type === CheckResultType.FirstNotMatch) {
        const range = await this.rangeForCheck.getRange()
        const rangeFirstBlockHeader: BlockHeader = range[0]
        await this.currentBlockNumber.updateCurrent(BigInt(rangeFirstBlockHeader.number))
        await this.rangeForCheck.clearRange()
        await TransactionPersistor.deleteWhenFork(rangeFirstBlockHeader.number)
        await this.clear()
        this.startBlockNumber = await this.currentBlockNumber.getCurrent()
        this.batchPush()
      } else if (checkResult.type === CheckResultType.BlockHeadersNotMatch) {
        // throw here and retry 5 times
        throw new Error('chain forked')
      }
    }

    return checkResult
  }

  public push = (blockNumbers: string[]): void => {
    this.q.push({ blockNumbers })
  }

  public batchPush = (): void => {
    const rangeArr = Utils.rangeForBigInt(this.startBlockNumber, this.endBlockNumber)

    const slice = Utils.eachSlice(rangeArr, this.fetchSize)

    slice.forEach(arr => {
      this.push(arr)
    })
  }

  public reset = (startBlockNumber: string, endBlockNumber: string) => {
    this.startBlockNumber = BigInt(startBlockNumber)
    this.endBlockNumber = BigInt(endBlockNumber)

    if (this.startBlockNumber > this.endBlockNumber) {
      return
    }

    this.clear()
    this.batchPush()
  }

  public process = () => {
    if (this.startBlockNumber > this.endBlockNumber) {
      return undefined
    }
    return this.batchPush()
  }

  public waitForDrained = async () => {
    return this.q.waitForDrained()
  }
}
