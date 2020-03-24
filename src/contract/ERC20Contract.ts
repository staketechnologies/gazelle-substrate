import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import AccountId from '@polkadot/types/primitive/Generic/AccountId'
import { TypeRegistry } from '@polkadot/types'
import { IERC20Contract } from '@cryptoeconomicslab/contract'
import { Address, Integer } from '@cryptoeconomicslab/primitives'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import EventWatcher from '../events/SubstrateEventWatcher'

export class ERC20Contract implements IERC20Contract {
  registry: TypeRegistry
  contractId: AccountId
  eventWatcher: EventWatcher

  constructor(
    readonly address: Address,
    eventDb: KeyValueStore,
    readonly api: ApiPromise,
    readonly operatorKeyPair: KeyringPair
  ) {
    this.registry = new TypeRegistry()
    this.contractId = new AccountId(this.registry, this.address.data)
    this.eventWatcher = new EventWatcher({
      api: this.api,
      kvs: eventDb,
      contractAddress: address.data
    })
  }

  public async approve(spender: Address, amount: Integer) {
    await this.api.tx.commitment
      .approve(spender.data, amount.data)
      .signAndSend(this.operatorKeyPair, {})
  }
}
