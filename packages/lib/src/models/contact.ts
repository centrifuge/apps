import { isValidAddress } from 'ethereumjs-util';
import { User } from './user';
import { unionBy } from 'lodash';

export class Contact {
  constructor(
    readonly name?: string,
    readonly address?: string,
    readonly ownerId?: string,
    readonly _id?: string,
  ) {
  }

  public static validate(contact: Contact) {
    if (!contact.name) {
      throw new Error('Contact name not specified');
    }

    if (!isValidAddress(contact.address!)) {
      throw new Error('Contact address must have ETH format');
    }
  }
}


/*
* Merges a contacts list with a user list
* */
export const extendContactsWithUsers = (contacts: Contact[], users: User[]) => {
  return unionBy(contacts, users.map(user => {
    return {
      name: user.name,
      address: user.account,
    };
  }), 'address');
};

/*
* Looks for a specific contract by address. If it does not find it
* it will return a Contact like object with the address also in name
* */
export const getContactByAddress = (address: string, contacts: Contact[]) => {
  const contact = contacts.find(c => c.address!.toLowerCase() === address.toLowerCase());
  return contact ? contact : {
    name: address,
    address,
  };
};
/*
* Takes a contact list and a list or contact like objects(object should have an address key).
* It tries to find the matching contact and return a list of merged objects. If the contact is not found
* the name will be the address
* */
export const extendContactLikeObjects = (contactLike: { address: string }[], contacts: Contact[]) => {
  return contactLike.map(c => {
    return {
      ...getContactByAddress(c.address, contacts),
      ...c,
    };
  });
};
