import { Application as SpectronApplication} from 'spectron'
import path from 'path'
import { clickMenu, editNetwork, editWallet, deleteNetwork, getElementByTagName, quitApp } from './utils';
import { increaseRunningAppCount, decreaseRunningAppCount, exitServer } from './utils'

export default class Application {
  spectron: SpectronApplication

  constructor() {
    let electronPath = path.join(__dirname, '../..', 'node_modules', '.bin', 'electron')
    if (process.platform === 'win32') {
      electronPath += '.cmd'
    }
    this.spectron = new SpectronApplication({ 
      args: [
        '--require',
        path.join(__dirname, 'preload.js'),
        path.join(__dirname, '../..', 'dist', 'main.js'),
        '--lang=en'
      ], 
      path: electronPath 
    })
  }

  async waitUntilLoaded() {
    await this.spectron.client.pause(400)
    await this.spectron.client.waitUntilWindowLoaded()
  }

  async start() {
    if (this.spectron.isRunning()) {
      return
    }
    await this.spectron.start()
    await this.spectron.client.waitUntilWindowLoaded(10000)
    const runningAppCount = await increaseRunningAppCount()
    console.log(`start ${runningAppCount} ${new Date().toTimeString()}`);
  }

  // Start multiple test applications at the same time, calling `spectron.stop()` will stop `ChromeDriver` when the first application finishes executing.
  // Other test applications will get an error `Error: connect ECONNREFUSED 127.0.0.1:9515`.
  // So need to close `spectron` after the last test.
  // Similar issue: https://github.com/electron-userland/spectron/issues/356
  async stop() {
    if (!this.spectron.isRunning()) {
      return
    }
    const runningAppCount = await decreaseRunningAppCount()
    if (runningAppCount > 0) {
      console.log(`quit ${runningAppCount} app ${new Date().toTimeString()}`);
      quitApp(this.spectron.electron)
    } else {
      console.log(`quit ${runningAppCount} spectron ${new Date().toTimeString()}`);
      await this.spectron.stop()
      await exitServer()
    }
  }

  // utils

  getElementByTagName(tagName: string, textContent: string) {
    return getElementByTagName(this.spectron.client, tagName, textContent)
  }

  editWallet(walletId: string) {
    return editWallet(this.spectron.electron, walletId)
  }

  clickMenu(labels: string[]) {
    return clickMenu(this.spectron.electron, labels)
  }

  editNetwork(networkId: string) {
    return editNetwork(this.spectron.electron, networkId)
  }

  deleteNetwork(networkId: string) {
    return deleteNetwork(this.spectron.electron, networkId)
  }
}
