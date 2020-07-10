import Keyring from '@polkadot/keyring'
import { ApiPromise, WsProvider } from '@polkadot/api'
import {
  PolcadotCoder,
  SubstrateWallet,
  DepositContract,
  ERC20Contract,
  CommitmentContract,
  AdjudicationContract,
  OwnershipPayoutContract,
  SubstarteContractConfig
} from '@cryptoeconomicslab/substrate-adaptor'
import { Address, Bytes } from '@cryptoeconomicslab/primitives'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import LightClient from '@cryptoeconomicslab/plasma-light-client'
import { DeciderConfig } from '@cryptoeconomicslab/ovm'
import { setupContext } from '@cryptoeconomicslab/context'
import customTypes from './customTypes'

setupContext({
  coder: PolcadotCoder
})

export interface SubstrateLightClientOptions {
  keyring: Keyring
  kvs: KeyValueStore
  config: DeciderConfig & SubstarteContractConfig
  aggregatorEndpoint?: string
}

export default async function initialize(options: SubstrateLightClientOptions) {
  const eventDb = await options.kvs.bucket(Bytes.fromString('event'))
  const keyring = options.keyring
  const provider = new WsProvider(
    process.env.PLASM_ENDPOINT || 'ws://127.0.0.1:9944'
  )
  const apiPromise = await ApiPromise.create({
    provider: provider,
    types: customTypes
  })
  const substrateWallet = new SubstrateWallet(keyring)
  const adjudicationContract = new AdjudicationContract(
    Address.from(options.config.adjudicationContract),
    eventDb,
    apiPromise,
    keyring.getPairs()[0]
  )
  function depositContractFactory(address: Address) {
    return new DepositContract(
      address,
      eventDb,
      apiPromise,
      keyring.getPairs()[0]
    )
  }
  function tokenContractFactory(address: Address) {
    return new ERC20Contract(address, apiPromise, keyring.getPairs()[0])
  }
  const commitmentContract = new CommitmentContract(
    Address.from(options.config.commitmentContract),
    eventDb,
    apiPromise,
    keyring.getPairs()[0]
  )
  const ownershipPayoutContract = new OwnershipPayoutContract(
    Address.from(options.config.payoutContracts['OwnershipPayout']),
    apiPromise,
    keyring.getPairs()[0]
  )
  const client = await LightClient.initilize({
    wallet: substrateWallet,
    witnessDb: options.kvs,
    adjudicationContract,
    depositContractFactory,
    tokenContractFactory,
    commitmentContract,
    ownershipPayoutContract,
    deciderConfig: options.config,
    aggregatorEndpoint: options.aggregatorEndpoint
  })
  await client.registerCustomToken(
    new ERC20Contract(
      Address.from(options.config.PlasmaETH),
      apiPromise,
      keyring.getPairs()[0]
    ),
    depositContractFactory(
      Address.from(options.config.payoutContracts['DepositContract'])
    )
  )
  await client.start()
  return client
}
