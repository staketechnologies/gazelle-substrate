import { Keyring } from '@polkadot/keyring'
import { Address, Bytes, BigNumber } from '@cryptoeconomicslab/primitives'
import { Wallet, Balance } from '@cryptoeconomicslab/wallet'
import { KeyringPair } from '@polkadot/keyring/types'

export class SubstrateWallet implements Wallet {
  private keyPair: KeyringPair

  constructor(readonly keyring: Keyring) {
    this.keyPair = keyring.getPairs()[0]
  }

  /**
   * get address of wallet
   */
  public getAddress(): Address {
    return Address.from(Bytes.from(this.keyPair.publicKey).toHexString())
  }

  /**
   * get balance of Layer 1
   * @param tokenAddress specify token address. If it's not provided, getL1Balance returns default token balance.
   */
  public async getL1Balance(tokenAddress?: Address): Promise<Balance> {
    return new Balance(BigNumber.from(0), 0, '')
  }

  /**
   * signMessage signed a hex string message
   * @param message is hex string
   */
  public async signMessage(message: Bytes): Promise<Bytes> {
    return Bytes.from(this.keyPair.sign(message.data))
  }

  /**
   * verify signature with publickey of keyPair
   */
  public async verifyMySignature(
    message: Bytes,
    signature: Bytes
  ): Promise<boolean> {
    return this.keyPair.verify(message.data, signature.data)
  }
}
