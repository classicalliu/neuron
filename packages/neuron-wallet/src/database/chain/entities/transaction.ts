import {
  Entity,
  BaseEntity,
  PrimaryColumn,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  AfterInsert,
  AfterUpdate,
  AfterRemove,
} from 'typeorm'
import { remote } from 'electron'
import { Witness, OutPoint, Transaction as TransactionInterface, TransactionStatus } from '../../../types/cell-types'
import InputEntity from './input'
import OutputEntity from './output'
import TxDbChangedSubject from '../../../models/subjects/tx-db-changed-subject'

const isRenderer = process && process.type === 'renderer'
const txDbChangedSubject = isRenderer
  ? remote.require('./models/subjects/tx-db-changed-subject').default.getSubject()
  : TxDbChangedSubject.getSubject()

/* eslint @typescript-eslint/no-unused-vars: "warn" */
@Entity()
export default class Transaction extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
  })
  hash!: string

  @Column({
    type: 'varchar',
  })
  version!: string

  @Column({
    type: 'simple-json',
  })
  deps!: OutPoint[]

  @Column({
    type: 'simple-json',
  })
  witnesses!: Witness[]

  @Column({
    type: 'varchar',
    nullable: true,
  })
  timestamp: string | undefined = undefined

  @Column({
    type: 'varchar',
    nullable: true,
  })
  blockNumber: string | undefined = undefined

  @Column({
    type: 'varchar',
    nullable: true,
  })
  blockHash: string | undefined = undefined

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string

  @Column({
    type: 'varchar',
  })
  status!: TransactionStatus

  @Column({
    type: 'varchar',
  })
  createdAt!: string

  @Column({
    type: 'varchar',
  })
  updatedAt!: string

  @OneToMany(_type => InputEntity, input => input.transaction)
  inputs!: InputEntity[]

  @OneToMany(_type => OutputEntity, output => output.transaction)
  outputs!: OutputEntity[]

  public toInterface(): TransactionInterface {
    const inputs = this.inputs ? this.inputs.map(input => input.toInterface()) : []
    const outputs = this.outputs ? this.outputs.map(output => output.toInterface()) : []
    return {
      hash: this.hash,
      version: this.version,
      deps: this.deps,
      inputs,
      outputs,
      timestamp: this.timestamp,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      witnesses: this.witnesses,
      description: this.description,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  @BeforeInsert()
  updateCreatedAt() {
    this.createdAt = Date.now().toString()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  updateUpdatedAt() {
    this.updatedAt = Date.now().toString()
  }

  @AfterInsert()
  emitInsert() {
    this.changed('AfterInsert')
  }

  @AfterUpdate()
  emitUpdate() {
    this.changed('AfterUpdate')
  }

  @AfterRemove()
  emitRemove() {
    this.changed('AfterRemove')
  }

  private changed = (event: string) => {
    txDbChangedSubject.next({
      event,
      tx: this.toInterface(),
    })
  }
}
