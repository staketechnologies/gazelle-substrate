import { SubstrateWallet } from '../../src/wallet/SubstrateWallet'
import Keyring from '@polkadot/keyring'
import { stringToU8a } from '@polkadot/util'
import { Address, Bytes } from '@cryptoeconomicslab/primitives'

describe('SubstrateWallet', () => {
  const seed = stringToU8a('12345678901234567890123456789012')
  const testSignature = Bytes.fromHexString(
    '0x2a46a53bb056b7d40245e14c2459ec6a5760a3d534f8119aa9e11ad434fb23a2ee5ac0a9f6e617b3f67532999e93a2c4eed85c64775fb540112e178f4343c709'
  )
  const testInvalidSignature = Bytes.fromHexString(
    '0x000000000056b7d40245e14c2459ec6a5760a3d534f8119aa9e11ad434fb23a2ee5ac0a9f6e617b3f67532999e93a2c4aaa88864775fb540112e178f43320100'
  )
  const message = Bytes.fromString('Hello')
  let wallet: SubstrateWallet

  beforeEach(() => {
    const keyring = new Keyring({ ss58Format: 42, type: 'ed25519' })
    keyring.addFromSeed(seed, {})
    wallet = new SubstrateWallet(keyring)
  })

  describe('getAddress', () => {
    test('sucees to get address', () => {
      expect(wallet.getAddress()).toEqual(
        Address.from(
          '0x2f8c6129d816cf51c374bc7f08c3e63ed156cf78aefb4a6550d97b87997977ee'
        )
      )
    })
  })

  describe('signMessage', () => {
    test('sucees to sign', async () => {
      const signature = await wallet.signMessage(message)
      expect(signature).toEqual(testSignature)
    })
  })

  describe('verifyMySignature', () => {
    test('sucees to verify', async () => {
      expect(
        await wallet.verifyMySignature(message, testSignature)
      ).toBeTruthy()
    })

    test('fail to verify', async () => {
      expect(
        await wallet.verifyMySignature(message, testInvalidSignature)
      ).toBeFalsy()
    })
  })
})
