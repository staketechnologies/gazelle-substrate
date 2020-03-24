import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import AccountId from '@polkadot/types/primitive/Generic/AccountId'
import { TypeRegistry, U256, H256 } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { ICommitmentContract, EventLog } from '@cryptoeconomicslab/contract'
import { Address, BigNumber, Bytes } from '@cryptoeconomicslab/primitives'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import EventWatcher from '../events/SubstrateEventWatcher'

export class CommitmentContract implements ICommitmentContract {
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
    // confirm that this.address.data is hex string
    this.contractId = new AccountId(this.registry, this.address.data)
    this.eventWatcher = new EventWatcher({
      api: this.api,
      kvs: eventDb,
      contractAddress: address.data
    })
  }

  /**
   * Submit Merkle root hash to Commitment Contract
   * @param blockNumber The block number where to submit Merkle root hash
   * @param root Merkle root Hash
   */
  async submit(blockNumber: BigNumber, root: Bytes) {
    await this.api.tx.commitment
      .submitRoot(
        this.contractId,
        blockNumber.raw,
        root.toHexString()
        // new U256(this.registry, blockNumber.raw),
        // new H256(this.registry, root.toHexString())
      )
      .signAndSend(this.operatorKeyPair, {})
  }

  /**
   * Get current Plasma block number
   */
  async getCurrentBlock(): Promise<BigNumber> {
    const blockNumber = await this.api.query.commitment.getCurrentBlock(
      this.contractId
    )
    return BigNumber.fromHexString(blockNumber.toHex())
  }

  /**
   * Get Merkle root hash by Plasma block number
   * @param blockNumber Plasma block number
   */
  async getRoot(blockNumber: BigNumber): Promise<Bytes> {
    const root = await this.api.query.commitment.getRoot(
      this.contractId,
      Bytes.fromHexString(blockNumber.toHexString()).data
    )
    return Bytes.fromHexString(root.toHex())
  }

  /**
   * Start to subscribe BlockSubmitted event
   * @param handler
   */
  subscribeBlockSubmitted(
    handler: (blockNumber: BigNumber, root: Bytes) => void
  ) {
    this.eventWatcher.subscribe('BlockSubmitted', (log: EventLog) => {
      const blockNumber: Codec = log.values[0]
      const root: Codec = log.values[1]
      handler(
        BigNumber.fromHexString(blockNumber.toHex()),
        Bytes.fromHexString(root.toHex())
      )
    })
  }
}
