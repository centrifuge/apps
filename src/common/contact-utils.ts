import { Contact } from './models/contact';
import { User } from './models/user';
import { unionBy } from 'lodash';

export const extendContactsWithUsers = (contacts: Contact[], users: User[]) => {
  return unionBy(contacts, users.map(user => {
    return {
      name: user.name,
      address: user.account,
    };
  }), 'address');
};


export const getContactByAddress = (address: string, contacts: Contact[]) => {
  const contact = contacts.find(c => c.address!.toLowerCase() === address.toLowerCase());
  return contact ? contact : {
    name: address,
    address,
  };
};
