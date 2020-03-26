export interface SubstarteContractConfig {
  adjudicationContract: string
  commitmentContract: string
  PlasmaETH: string
  payoutContracts: {
    OwnershipPayout: string
    DepositContract: string
  }
}
