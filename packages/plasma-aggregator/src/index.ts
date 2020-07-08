import { Address, Bytes } from '@cryptoeconomicslab/primitives'
import { RangeDb } from '@cryptoeconomicslab/db'
import leveldown from 'leveldown'
import { LevelKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import {
  PolcadotCoder,
  DepositContract,
  CommitmentContract,
  SubstrateWallet
} from '@cryptoeconomicslab/substrate-adaptor'
import Keyring from '@polkadot/keyring'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { stringToU8a } from '@polkadot/util'
import { setupContext } from '@cryptoeconomicslab/context'
setupContext({
  coder: PolcadotCoder
})
import fs from 'fs'
import { config } from 'dotenv'
config()

import Aggregator, {
  BlockManager,
  StateManager
} from '@cryptoeconomicslab/plasma-aggregator'

const instantiate = async (): Promise<Aggregator> => {
  const kvs = new LevelKeyValueStore(
    Bytes.fromString('plasma_aggregator'),
    leveldown('.db')
  )
  await kvs.open()

  const seed = stringToU8a(
    process.env.AGGREGATOR_PRIVATE_KEY || '12345678901234567890123456789012'
  )
  const keyring = new Keyring({ ss58Format: 42, type: 'ed25519' })
  keyring.addFromSeed(seed, {})
  const provider = new WsProvider(
    process.env.PLASM_ENDPOINT || 'ws://127.0.0.1:9944'
  )
  const apiPromise = await ApiPromise.create({
    provider,
    types: {
      Decision: {
        _enum: ['Undecided', 'True', 'False']
      },
      ChallengeGameOf: {
        property: 'Property',
        challenges: 'Vec<Hash>',
        decision: 'Decision',
        created_block: 'BlockNumber'
      },
      Checkpoint: {
        state_update: 'StateUpdate',
        sub_range: 'Range'
      },
      OfferOf: {},
      Parameters: {
        can_be_nominated: 'bool',
        option_expired: 'u128',
        option_p: 'u128'
      },
      PredicateContractOf: {
        predicate_hash: 'CodeHash',
        inputs: 'Vec<u8>'
      },
      PredicateHash: 'Hash',
      PrefabOvmModule: {
        schedule_version: 'u32',
        code: 'Vec<u8>'
      },
      Property: {
        predicate_address: 'AccountId',
        inputs: 'Vec<Vec<u8>>'
      },
      PropertyOf: {
        predicate_address: 'AccountId',
        inputs: 'Vec<Vec<u8>>'
      },
      Range: {
        start: 'u128',
        end: 'u128'
      },
      RangeOf: {
        start: 'u128',
        end: 'u128'
      },
      StateObject: {
        predicate: 'AccountId',
        data: 'Vec<u8>'
      },
      StateUpdate: {
        range: 'Range',
        state_object: 'StateObject',
        plasma_block_number: 'BlockNumber'
      }
    }
  })

  const wallet = new SubstrateWallet(keyring)

  const stateBucket = await kvs.bucket(Bytes.fromString('state_update'))
  const stateDb = new RangeDb(stateBucket)
  const blockDb = await kvs.bucket(Bytes.fromString('block'))
  const stateManager = new StateManager(stateDb)
  const blockManager = new BlockManager(blockDb)
  const witnessDb = await kvs.bucket(Bytes.fromString('witness'))
  const eventDb = await kvs.bucket(Bytes.fromString('event'))
  function depositContractFactory(address: Address) {
    console.log('depositContractFactory', address)
    return new DepositContract(
      address,
      eventDb,
      apiPromise,
      keyring.getPairs()[0]
    )
  }
  function commitmentContractFactory(address: Address) {
    return new CommitmentContract(
      address,
      eventDb,
      apiPromise,
      keyring.getPairs()[0]
    )
  }

  const config = loadConfigFile(process.env.CONFIG_FILE || 'config.local.json')
  const aggregator = new Aggregator(
    wallet,
    stateManager,
    blockManager,
    witnessDb,
    depositContractFactory,
    commitmentContractFactory,
    config,
    { isSubmitter: true, port: Number(process.env.PORT || 3000) }
  )
  aggregator.registerToken(Address.from(config.payoutContracts.DepositContract))
  return aggregator
}

async function main() {
  const aggregator = await instantiate()
  aggregator.run()
  console.log('aggregator is running on port ', process.env.PORT)
}

function loadConfigFile(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath).toString())
}

main()
