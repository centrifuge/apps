import { User } from '@centrifuge/gateway-lib/models/user';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { AttrTypes } from '@centrifuge/gateway-lib/models/schema';
import { Collaborator } from '@centrifuge/gateway-lib/models/collaborator';
import { DOCUMENT_ACCESS } from '@centrifuge/gateway-lib/models/document';

export const defaultUser: User = {
  name: 'Default User',
  account: '0xDefaultAccount',
  chain: {
    centrifuge_chain_account: {
      id: 'testid',
      secret: 'testsecret',
      ss_58_address: 'testaddress'
    }
  },
  email: 'default@user.com',
  invited: true,
  enabled: true,
  permissions: [],
  schemas: ['first_schema', 'second_schema'],
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
    address: '0x44a0579754D6c94e7bB2c26bFA7394311Cc50Ccb',
  },

];


export const defaultCollaborators = [
  {
    ...defaultContacts[0],
    access: DOCUMENT_ACCESS.WRITE,
  },
  {
    ...defaultContacts[1],
    access: DOCUMENT_ACCESS.READ,
  },
  {
    ...defaultContacts[2],
    access: DOCUMENT_ACCESS.WRITE,
  },
];


export const defaultSchemas = [
  {
    name: 'first_schema',
    registries: [
      {
        label: 'First Registry',
        address: '0xFirstRegistry',
        proofs: [
          'firstRegistryFirstProof',
          'firstRegistrySecondProof',
        ],
      },
      {
        label: 'Second Registry',
        address: '0xSecondRegistry',
        proofs: [
          'secondRegistryFirstProof',
          'secondRegistrySecondProof',
        ],
      },
    ],
    formFeatures: {
      fundingAgreement: true,
      comments: true,
    },
    attributes: [
      {
        name: 'reference_id',
        label: 'Reference Id',
        type: AttrTypes.STRING,
      },
      {
        name: 'amount',
        label: 'Amount',
        type: AttrTypes.DECIMAL,
        options: ['1', '2', '3'],
      },
      {
        name: 'index',
        label: 'Index',
        type: AttrTypes.INTEGER,
      },
      {
        name: 'percent',
        label: 'Percent',
        type: AttrTypes.PERCENT,
      },
      {
        name: 'date',
        label: 'Some Date',
        type: AttrTypes.TIMESTAMP,
      },
      {
        name: 'customer',
        label: 'Customer',
        type: AttrTypes.STRING,
      },
    ],
  },
  {
    name: 'second_schema',
    registries: [],
    attributes: [
      {
        name: 'reference_id',
        label: 'Reference Id',
        type: AttrTypes.STRING,
      },
      {
        name: 'amount',
        label: 'Amount',
        type: AttrTypes.DECIMAL,
      },
      {
        name: 'customer',
        label: 'Customer',
        type: AttrTypes.STRING,
      },
    ],
  },
];

