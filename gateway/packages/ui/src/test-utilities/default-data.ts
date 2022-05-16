import { Collaborator } from '@centrifuge/gateway-lib/models/collaborator'
import { Contact } from '@centrifuge/gateway-lib/models/contact'
import { DOCUMENT_ACCESS } from '@centrifuge/gateway-lib/models/document'
import { AttrTypes } from '@centrifuge/gateway-lib/models/schema'
import { User } from '@centrifuge/gateway-lib/models/user'

export const defaultUser: User = {
  name: 'Default User',
  account: '0xB198358FE22Ee4A8Ee9c739939B0eC5a1204bb6A',
  chain: {
    centrifugeChainAccount: {
      id: 'testid',
      secret: 'testsecret',
      ss_58_address: 'testaddress',
    },
  },
  email: 'default@user.com',
  invited: true,
  enabled: true,
  permissions: [],
  schemas: ['first_schema', 'second_schema'],
}

export const defaultToken: string = 'test'

export const defaultContacts: Contact[] = [
  {
    name: 'First Contact',
    address: '0xf15B1DDb4Ec697bf148F0417A0f397f2F6Bb6166',
  },
  {
    name: 'Second Contact',
    address: '0x8d9015C37901ac41872Ddfc34fb97B1644c281c6',
  },
  {
    name: 'Third Contact',
    address: '0x44a0579754D6c94e7bB2c26bFA7394311Cc50Ccb',
  },
]

export const defaultCollaborators = [
  new Collaborator(defaultContacts[0].address || '', defaultContacts[0].name || '', DOCUMENT_ACCESS.WRITE),
  new Collaborator(defaultContacts[1].address || '', defaultContacts[1].name || '', DOCUMENT_ACCESS.READ),
  new Collaborator(defaultContacts[2].address || '', defaultContacts[2].name || '', DOCUMENT_ACCESS.WRITE),
]

export const defaultSchemas = [
  {
    name: 'first_schema',
    registries: [
      {
        label: 'First Registry',
        address: '0x414C30A8824D4Ed8479e0d58F35A629C671a8db1',
        asset_manager_address: '0x414C30A8824D4Ed8479e0d58F35A629C671a8db1',
        proofs: ['firstRegistryFirstProof', 'firstRegistrySecondProof'],
      },
      {
        label: 'Second Registry',
        address: '0x414C30A8824D4Ed8479e0d58F35A629C671a8db1',
        asset_manager_address: '0x414C30A8824D4Ed8479e0d58F35A629C671a8db1',
        proofs: ['secondRegistryFirstProof', 'secondRegistrySecondProof'],
      },
    ],
    collaborators: [],
    formFeatures: {
      fundingAgreement: true,
      comments: true,
    },
    template: '',
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
    collaborators: [],
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
]
