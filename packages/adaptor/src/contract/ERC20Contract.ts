import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import AccountId from '@polkadot/types/primitive/Generic/AccountId'
import { TypeRegistry } from '@polkadot/types'
import { IERC20DetailedContract } from '@cryptoeconomicslab/contract'
import { Address, Integer } from '@cryptoeconomicslab/primitives'

export class ERC20Contract implements IERC20DetailedContract {
  registry: TypeRegistry
  contractId: AccountId

  constructor(
    readonly address: Address,
    readonly api: ApiPromise,
    readonly operatorKeyPair: KeyringPair
  ) {
    this.registry = new TypeRegistry()
    this.contractId = new AccountId(this.registry, this.address.data)
  }

  public async approve(spender: Address, amount: Integer) {
    await this.api.tx.commitment
      .approve(spender.data, amount.data)
      .signAndSend(this.operatorKeyPair, {})
  }

  public async decimals(): Promise<Integer> {
    return Integer.from(18)
  }
}
