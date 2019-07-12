import { getConnection } from 'typeorm'
import TransactionsService, { SearchType, OutputStatus } from '../../src/services/transactions'
import initConnection from '../../src/database/chain/ormconfig'
import { initConnection as initAddressDB } from '../../src/database/address/ormconfig'
import { tx as mockedTx } from '../fixtures/transactions'
import TransactionEntity from '../../src/database/chain/entities/transaction'
import { TransactionStatus } from '../../src/types/cell-types'

describe('transactions service', () => {
  describe('filterSearchType', () => {
    it('ckt prefix', () => {
      const address = 'ckt1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf'
      const type = TransactionsService.filterSearchType(address)
      expect(type).toBe(SearchType.Address)
    })

    it('ckb prefix', () => {
      const address = 'ckb1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf'
      const type = TransactionsService.filterSearchType(address)
      expect(type).toBe(SearchType.Address)
    })

    it('0x prefix', () => {
      const hash = '0x01831733c1b46f461fb49007f8b99449bc40cfdfd0e249da23f178a37139e1a1'
      const type = TransactionsService.filterSearchType(hash)
      expect(type).toBe(SearchType.TxHash)
    })

    it('2019-02-18', () => {
      const date = '2019-02-18'
      const type = TransactionsService.filterSearchType(date)
      expect(type).toBe(SearchType.Date)
    })

    it('100', () => {
      const amount = '100'
      const type = TransactionsService.filterSearchType(amount)
      expect(type).toBe(SearchType.Amount)
    })

    it('-100', () => {
      const amount = '-100'
      const type = TransactionsService.filterSearchType(amount)
      expect(type).toBe(SearchType.Amount)
    })

    it('-', () => {
      const value = '-'
      const type = TransactionsService.filterSearchType(value)
      expect(type).toBe(SearchType.Unknown)
    })

    it('empty string', () => {
      const value = ''
      const type = TransactionsService.filterSearchType(value)
      expect(type).toBe(SearchType.Empty)
    })

    it('2019-2-18', () => {
      const value = '2019-2-18'
      const type = TransactionsService.filterSearchType(value)
      expect(type).toBe(SearchType.Unknown)
    })
  })

  describe('with db', () => {
    const genesisBlockHash = '0x7d789ed1c7641670dfb411ff0d220b77b7e95a864d8b7284088660b353122345'

    beforeAll(async done => {
      await initAddressDB()
      await initConnection(genesisBlockHash)
      done()
    })

    afterAll(async done => {
      await getConnection().close()
      done()
    })

    beforeEach(async done => {
      const connection = getConnection()
      await connection.dropDatabase()
      await connection.synchronize()
      done()
    })

    const createTx = async () => {
      return TransactionsService.create(mockedTx, OutputStatus.Live, OutputStatus.Dead)
    }

    describe('create', () => {
      it('success', async () => {
        await TransactionsService.create(mockedTx, OutputStatus.Live, OutputStatus.Dead)

        const tx = await getConnection()
          .getRepository(TransactionEntity)
          .findOne({ relations: ['inputs', 'outputs'] })

        const outputStatus = [...new Set(tx!.outputs.map(o => o.status))]
        expect(outputStatus).toEqual([OutputStatus.Live])
        expect(tx!.status).toEqual(TransactionStatus.Success)
      })
    })

    describe('get', () => {
      it('success', async () => {
        const tx = await createTx()
        const { hash } = tx
        const transaction = await TransactionsService.get(hash)
        expect(transaction!.hash).toEqual(hash)
      })

      it('undefined', async () => {
        await createTx()
        const hash = '0xa17363ce079cf43642e38489a7e94051e70d13a2845e0f2de5bdb51b0bef667a'
        const transaction = await TransactionsService.get(hash)
        expect(transaction).toBe(undefined)
      })
    })

    describe('saveWithSent', () => {
      it('success', async () => {
        await TransactionsService.saveWithSent(mockedTx)
        const tx = await getConnection()
          .getRepository(TransactionEntity)
          .findOne({ relations: ['inputs', 'outputs'] })

        const outputStatus = [...new Set(tx!.outputs.map(o => o.status))]
        // TODO: should test previous output
        expect(outputStatus).toEqual([OutputStatus.Sent])
      })
    })

    describe('saveWithFetch', () => {
      it('success', async () => {
        await TransactionsService.saveWithFetch(mockedTx)
        const tx = await getConnection()
          .getRepository(TransactionEntity)
          .findOne({ relations: ['inputs', 'outputs'] })

        const outputStatus = [...new Set(tx!.outputs.map(o => o.status))]
        // TODO: should test previous output
        expect(outputStatus).toEqual([OutputStatus.Live])
      })

      it('tx is sent before', async () => {
        const txToSent = Object.assign({}, mockedTx)
        txToSent.timestamp = undefined
        txToSent.blockHash = undefined
        txToSent.blockNumber = undefined
        await TransactionsService.saveWithSent(txToSent)
        const tx = await getConnection()
          .getRepository(TransactionEntity)
          .findOne({ relations: ['inputs', 'outputs'] })

        const outputStatus = [...new Set(tx!.outputs.map(o => o.status))]

        expect(outputStatus).toEqual([OutputStatus.Sent])
        expect(tx!.status).toEqual(TransactionStatus.Pending)
        expect(tx!.timestamp).toEqual(null)
        expect(tx!.blockNumber).toEqual(null)
        expect(tx!.blockHash).toEqual(null)

        await TransactionsService.saveWithFetch(mockedTx)
        const tx2 = await getConnection()
          .getRepository(TransactionEntity)
          .findOne({ relations: ['inputs', 'outputs'] })

        const newOutputStatus = [...new Set(tx2!.outputs.map(o => o.status))]
        expect(newOutputStatus).toEqual([OutputStatus.Live])
        expect(tx2!.status).toEqual(TransactionStatus.Success)
        expect(tx2!.timestamp).not.toBeNull()
        expect(tx2!.blockNumber).not.toBeNull()
        expect(tx2!.blockHash).not.toBeNull()
      })
    })

    describe('deleteByBlockNumbers', () => {
      it('success', async () => {
        const tx = await createTx()
        const { blockNumber } = tx
        const count = await getConnection()
          .getRepository(TransactionEntity)
          .createQueryBuilder('tx')
          .getCount()
        expect(count).toEqual(1)
        await TransactionsService.deleteByBlockNumbers([blockNumber!])
        const count2 = await getConnection()
          .getRepository(TransactionEntity)
          .createQueryBuilder('tx')
          .getCount()
        expect(count2).toEqual(0)
      })
    })
  })
})
