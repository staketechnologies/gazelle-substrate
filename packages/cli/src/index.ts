import { ApiPromise } from '@polkadot/api'
import Keyring from '@polkadot/keyring'
import { TypeRegistry } from '@polkadot/types'
import { stringToU8a } from '@polkadot/util'
import initialize from '@cryptoeconomicslab/substrate-plasma-light-client'
import { Bytes, Address } from '@cryptoeconomicslab/primitives'
import leveldown from 'leveldown'
import { LevelKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import {
  encodeToPolcadotCodec,
  decodeFromPolcadotCodec
} from '@cryptoeconomicslab/substrate-adaptor'
import * as deciderConfig from './config.local.json'
import { config } from 'dotenv'
config()

import Cli from 'cac'
const cli = Cli()

const tokenAddress = deciderConfig.payoutContracts.DepositContract

function getKeyring() {
  const keyringType = process.env.KEYRING_TYPE || 'SEED'
  let keyring = new Keyring({ ss58Format: 42, type: 'ecdsa' })
  if (keyringType === 'SEED') {
    const seed = stringToU8a(process.env.KEYRING_SEED)
    keyring.addFromSeed(seed, {})
  } else if (keyringType === 'DEV') {
    keyring.addFromUri('//Alice', { name: 'user' })
  } else {
    throw new Error('unknown keyring type')
  }
  return keyring
}

async function instantiate() {
  const keyring = getKeyring()
  const kvs = new LevelKeyValueStore(Bytes.fromString('cli'), leveldown('.db'))
  return initialize({ keyring, kvs, config: deciderConfig as any })
}

cli.command('deposit <amount>', 'Deposit').action(async (amount, options) => {
  const lightClient = await instantiate()
  await lightClient.deposit(Number(amount), tokenAddress)
  console.log('deposited')
})
cli.command('balance', 'getBalance').action(async options => {
  const lightClient = await instantiate()
  const balances = await lightClient.getBalance()
  const balanceOfL1 = await lightClient['wallet'].getL1Balance()
  console.log('Balance L1:', balanceOfL1)
  console.log('Balance L2:', balances)
})
cli
  .command('transfer <amount> <to>', 'transfer')
  .action(async (amount, to, options) => {
    const lightClient = await instantiate()
    await lightClient.transfer(amount, tokenAddress, to)
  })

cli.command('deploy', 'deploy').action(async options => {
  const registry = new TypeRegistry()
  const lightClient = await instantiate()
  const api: ApiPromise = lightClient['adjudicationContract']['api']
  const operatorKeyPair = lightClient['adjudicationContract']['operatorKeyPair']
  const operatorId = Address.from(deciderConfig.PlasmaETH)
  const erc20 = Address.from(deciderConfig.PlasmaETH)
  const stateUpdatePredicate = Address.from(
    deciderConfig.deployedPredicateTable.StateUpdatePredicate.deployedAddress
  )
  const exitPredicate = Address.from(
    deciderConfig.deployedPredicateTable.ExitPredicate.deployedAddress
  )
  const exitDepositPredicate = Address.from(
    deciderConfig.deployedPredicateTable.ExitPredicate.deployedAddress
  )
  const r = await api.tx.plasma
    .deploy(
      encodeToPolcadotCodec(registry, operatorId),
      encodeToPolcadotCodec(registry, erc20),
      encodeToPolcadotCodec(registry, stateUpdatePredicate),
      encodeToPolcadotCodec(registry, exitPredicate),
      encodeToPolcadotCodec(registry, exitDepositPredicate)
    )
    .signAndSend(operatorKeyPair, { tip: 0 })
  console.log(r)
})

cli.help()
cli.parse()
