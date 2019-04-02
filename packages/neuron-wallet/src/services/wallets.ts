import asw from '../wallets/asw'
import WalletStore from '../store/WalletStore'
import Key from '../keys/key'

const walletStore = new WalletStore()

export interface Wallet {
  id: string
  name: string
  address?: string
  publicKey?: Uint8Array
}

// this should come from config or db
export const defaultWallet: Wallet = {
  id: '0',
  name: 'asw',
  address: asw.address,
  publicKey: asw.publicKey,
}

export default class WalletService {
  public wallets: Wallet[] = []

  public active: Wallet | undefined = undefined

  constructor() {
    this.create({
      name: 'asw',
      keystore: '{"master":{"privateKey":"","chainCode":""},"password":"0"}',
      address: asw.address,
      publicKey: asw.publicKey,
    })
    this.setActive(walletStore.getAllWallets()[0].id)
  }

  public index = (
    { pageNo = 0, pageSize = 15 }: { pageNo: number; pageSize: number } = { pageNo: 0, pageSize: 15 },
  ): Wallet[] => {
    return walletStore
      .getAllWallets()
      .slice(pageNo * pageSize, (pageNo + 1) * pageSize)
      .map(w => ({
        id: w.id,
        name: w.name,
        address: `address of ${w.id}`,
        publicKey: Buffer.from(`address of ${w.id}`),
      }))
  }

  public show = (id: string): Wallet | undefined => {
    return this.wallets.find(wallet => wallet.id === id)
  }

  public create = ({
    name,
    keystore,
    address,
    publicKey,
  }: {
    name: string
    keystore: string
    address?: string
    publicKey?: Uint8Array
  }): Wallet => {
    const id = walletStore.saveWallet(name, Key.fromKeystoreString(keystore).getKeystore())
    if (id) {
      const storedWallet = walletStore.getWallet(id)
      return {
        id,
        name: storedWallet.name,
        address,
        publicKey,
      }
    }
    throw new Error('Failed to create wallet')
  }

  public validate = ({ id, password }: { id: string; password: string }) => {
    const wallet = walletStore.getWallet(id)
    const keystore = Key.fromKeystore(wallet.keystore)
    return keystore.checkPassword(password)
  }

  // TODO: update wallet
  // public update = ({
  //   id,
  //   name,
  //   address,
  //   publicKey,
  // }: {
  //   id: string
  //   name?: string
  //   address?: string
  //   publicKey?: Uint8Array
  // }): boolean => {
  //   const wallet = this.show(id)
  //   if (wallet) {
  //     if (name) {
  //       wallet.name = name
  //     }
  //     if (address) {
  //       wallet.address = address
  //     }
  //     if (publicKey) {
  //       wallet.publicKey = publicKey
  //     }
  //     return true
  //   }
  //   return false
  // }

  public delete = (id: string): boolean => {
    const wallet = this.show(id)
    if (wallet) {
      this.wallets = this.wallets.filter(w => w.id !== id)
      walletStore.deleteWallet(id)
      return true
    }
    return false
  }

  public setActive = (id: string): boolean => {
    const wallet = this.show(id)
    if (wallet) {
      this.active = wallet
      return true
    }
    return false
  }
}