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
import { ApiPromise } from '@polkadot/api'
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
  const apiPromise = new ApiPromise({})

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
