import { Transaction } from '../../src/types/cell-types'

export const txEntity = {
  timestamp: '1562906078319',
  blockNumber: '61',
  blockHash: '0xa17363ce079cf43642e38489a7e94051e70d13a2845e0f2de5bdb51b0bef667a',
  hash: '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5',
  version: '0',
  deps: [
    {
      blockHash: null,
      cell: {
        txHash: '0x606242ae42a472e8d8bc542cc64f8ae0430d948e3efff4e44121f8ae67709671',
        index: '1',
      },
    },
  ],
  witnesses: [
    {
      data: [
        '0xba4a3ca5d2a37d5a09cdc6a57203933a337c012e1bc844cf80014141da60962c439943850890673c0d3a689b32b76a17ddebdc76c233742c8e6ec1082e6b42ff00',
      ],
    },
  ],
  description: null,
  status: 'success',
  createdAt: '1562906082228',
  updatedAt: '1562906082228',
  inputs: [
    {
      outPointTxHash: '0x8596a80081620be50fd16acbdb094bd0b757ac75e7dcade9d5e554ee9fae81fd',
      outPointIndex: '0',
      lockHash: null,
      capacity: null,
      id: 1,
      since: '0',
    },
  ],
  outputs: [
    {
      outPointTxHash: '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5',
      outPointIndex: '0',
      capacity: '10000000000',
      lock: {
        args: ['0xc5ff838ff260eeaa2590c141cc5b4c9ccea1ae98'],
        codeHash: '0x94334bdda40b69bae067d84937aa6bbccf8acd0df6626d4b9ac70d4612a11933',
      },
      lockHash: '0x2fcda0ec3e6dd4c63c9ee9af516235006632bc484d2cc39eae666761fc31978c',
      status: 'live',
    },
    {
      outPointTxHash: '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5',
      outPointIndex: '1',
      capacity: '90000000000',
      lock: {
        args: ['0x2623d49e4622def5b01650a44d60e472942f2408'],
        codeHash: '0x94334bdda40b69bae067d84937aa6bbccf8acd0df6626d4b9ac70d4612a11933',
      },
      lockHash: '0xcbc50b794b82357c038d6c20e62b48a3d1ae1595c0e8b258bdacda5d32e01a23',
      status: 'live',
    },
  ],
}

export const txHash = '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5'
export const tx: Transaction = {
  hash: '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5',
  version: '0',
  deps: [
    {
      blockHash: null,
      cell: {
        txHash: '0x606242ae42a472e8d8bc542cc64f8ae0430d948e3efff4e44121f8ae67709671',
        index: '1',
      },
    },
  ],
  inputs: [
    {
      previousOutput: {
        blockHash: null,
        cell: {
          txHash: '0x8596a80081620be50fd16acbdb094bd0b757ac75e7dcade9d5e554ee9fae81fd',
          index: '0',
        },
      },
      since: '0',
    },
  ],
  outputs: [
    {
      capacity: '10000000000',
      lock: {
        args: ['0xc5ff838ff260eeaa2590c141cc5b4c9ccea1ae98'],
        codeHash: '0x94334bdda40b69bae067d84937aa6bbccf8acd0df6626d4b9ac70d4612a11933',
      },
      lockHash: '0x2fcda0ec3e6dd4c63c9ee9af516235006632bc484d2cc39eae666761fc31978c',
      outPoint: {
        blockHash: null,
        cell: {
          txHash: '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5',
          index: '0',
        },
      },
    },
    {
      capacity: '90000000000',
      lock: {
        args: ['0x2623d49e4622def5b01650a44d60e472942f2408'],
        codeHash: '0x94334bdda40b69bae067d84937aa6bbccf8acd0df6626d4b9ac70d4612a11933',
      },
      lockHash: '0xcbc50b794b82357c038d6c20e62b48a3d1ae1595c0e8b258bdacda5d32e01a23',
      outPoint: {
        blockHash: null,
        cell: {
          txHash: '0x2904b6382221735c0a278f93a5d4054f21abc2bf9fe15bfcaf0cb3c6f5a82da5',
          index: '1',
        },
      },
    },
  ],
  timestamp: '1562906078319',
  blockNumber: '61',
  blockHash: '0xa17363ce079cf43642e38489a7e94051e70d13a2845e0f2de5bdb51b0bef667a',
  witnesses: [
    {
      data: [
        '0xba4a3ca5d2a37d5a09cdc6a57203933a337c012e1bc844cf80014141da60962c439943850890673c0d3a689b32b76a17ddebdc76c233742c8e6ec1082e6b42ff00',
      ],
    },
  ],
  description: undefined,
  createdAt: '1562906082228',
  updatedAt: '1562906082228',
}

export default undefined
