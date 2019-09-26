import { User } from '@centrifuge/gateway-lib/models/user';
import { Contact } from '@centrifuge/gateway-lib/models/contact';

export const defaultUser: User = {
  name: 'Default User',
  account: '0xDefaultAccount',
  email: 'default@user.com',
  invited: true,
  enabled: true,
  permissions: [],
  schemas: [],
};

export const defaultContacts: Contact[] = [
  {
    name: 'First Contact',
    address: '0xFirstContact',
  },
  {
    name: 'Second Contact',
    address: '0xSecondContact',
  },
  {
    name: 'Third Contact',
    address: '0xThirdContact',
  },

];
