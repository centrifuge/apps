import { isValidAddress } from 'ethereumjs-util';

export class Contact {
  constructor(
    readonly name: string,
    readonly address: string,
    readonly ownerId?: string,
    readonly _id?: string,
  ) {}

  public static validate(contact: Contact) {
    if (!contact.name) {
      throw new Error('Contact name not specified');
    }

    if (!contact.address) {
      throw new Error('Contact address not specified');
    }
  }
}
