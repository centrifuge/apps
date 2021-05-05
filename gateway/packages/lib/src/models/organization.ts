import { isValidAddress } from 'ethereumjs-util';

export class Organization {
  constructor(
    readonly name?: string,
    readonly account?: string,
    readonly _id?: string,
  ) {
  }

  public static validate(org: Organization) {
    if (!org.name) {
      throw new Error('Organization name not specified');
    }

    if (!isValidAddress(org.account!)) {
      throw new Error('Organisation address must have ETH format');
    }
  }
}
