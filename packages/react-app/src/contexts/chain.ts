import { createContext } from 'react'
import { NETWORK_STATUS } from '../utils/const'

const chain = {
  cells: [],
  network: {
    ip: '',
    status: NETWORK_STATUS.OFFLINE,
  },
}

const ChainContext = createContext(chain)
export default ChainContext