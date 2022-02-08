import { palletErrors } from '../palletErrors'

export class PalletError extends Error {
  pallet: string
  error: string
  constructor(pallet: string, error: string) {
    const message = (palletErrors as any)[pallet]?.[error]
    super(message)
    this.pallet = pallet
    this.error = error
  }
}
