import { createContext } from 'react'
import { loadNetworks } from '../utils/localStorage'

import { Network } from './Chain'
import { Wallet } from './Wallet'

export const defaultNetworks = (() => {
  const cachedNetworks = loadNetworks()
  if (cachedNetworks.length) {
    return cachedNetworks
  }
  const { REACT_APP_NETWORKS } = process.env
  if (REACT_APP_NETWORKS) {
    return JSON.parse(REACT_APP_NETWORKS)
  }
  return []
})()

interface WalletSettings {
  seeds: string
  name: string
  seedsValid: boolean
  passwordValid: boolean
  networks: Network[]
  wallets: Wallet[]
}

export const initSettings: WalletSettings = {
  seeds: 'supporse only 1 is valid seed',
  name: '',
  seedsValid: false,
  passwordValid: false,
  networks: defaultNetworks,
  wallets: [],
}

const WalletContext = createContext<WalletSettings>(initSettings)
export default WalletContext
