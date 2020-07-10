export default {
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
