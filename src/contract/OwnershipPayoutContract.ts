import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import AccountId from '@polkadot/types/primitive/Generic/AccountId'
import { TypeRegistry } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { IOwnershipPayoutContract } from '@cryptoeconomicslab/contract'
import { Address, BigNumber, Codable } from '@cryptoeconomicslab/primitives'
import { Property } from '@cryptoeconomicslab/ovm'
import { encodeToPolcadotCodec } from '../coder/PolcadotCoder'

export class OwnershipPayoutContract implements IOwnershipPayoutContract {
  private registry: TypeRegistry
  private contractId: AccountId

  constructor(
    readonly address: Address,
    readonly api: ApiPromise,
    readonly operatorKeyPair: KeyringPair
  ) {
    this.registry = new TypeRegistry()
    this.contractId = new AccountId(this.registry, this.address.data)
  }

  public async finalizeExit(
    depositContractAddress: Address,
    exitProperty: Property,
    depositedRangeId: BigNumber,
    owner: Address
  ): Promise<void> {
    await this.api.tx.ownership
      .approve(
        this.contractId,
        ...[
          depositContractAddress,
          exitProperty.toStruct(),
          depositedRangeId,
          owner
        ].map(i => this.encodeParam(i))
      )
      .signAndSend(this.operatorKeyPair, {})
  }

  private encodeParam(input: Codable): Codec {
    return encodeToPolcadotCodec(this.registry, input)
  }
}
