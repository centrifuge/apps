import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Anchor, Button, DataTable } from 'grommet';
import { defaultContacts, defaultUser } from '../../test-utilities/default-data';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import Collaborators from '../Collaborators';
import { Formik } from 'formik';
import CollaboratorForm from '../CollaboratorForm';
import { act } from 'react-dom/test-utils';
import { DOCUMENT_ACCESS } from '@centrifuge/gateway-lib/models/document';
import { Modal } from '@centrifuge/axis-modal';


describe('Collaborators', () => {


  const getDocument = () => {
    return {
      _id: 'first_id',
      header: {

        nfts: [
          {
            owner: 'Owner of first nft',
            registry: '0xFirstRegistry',
            token_id: '0x8416c0d06fae1a25dd11e6f0991f58816e0c2de1c755aa5a9ceee389f23ded3c',
          },
          {
            owner: 'Owner of second nft',
            registry: '0xSecondRegistry',
            token_id: '0xSecondTokenId',
          },
        ],
      },
      createdAt: new Date('2019-07-09T10:54:59.900Z'),
      attributes: {

        ['_schema']: {
          key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'string',
          value: 'first_schema',
        },

        ['reference_id']: {
          key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'string',
          value: 'reference nr1',
        },

        ['customer']: {
          key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'string',
          value: 'some customer',
        },

        ['percent']: {
          key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'decimal',
          value: '100',
        },
        ['amount']: {
          key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'decimal',
          value: '100',
        },
      },
    };
  };


  it('Should render a empty list of collaborators and not render the add button', () => {

    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={getDocument()}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={true}
            user={defaultUser}/>
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);
    expect(dataTable.length).toEqual(1);
    const rows = dataTable.find('tbody tr');
    expect(rows.length).toBe(0);
    const addCollaborator = component.find(Button).findWhere(node => node.key() === 'add-collaborator');
    expect(addCollaborator.length).toBe(0);
  });


  it('Should render 2 collaborators list of collaborators and the add button', () => {

    const doc: any = getDocument();
    doc.header.author = defaultContacts[0].address;
    doc.header.write_access = [
      defaultContacts[0].address,
    ];

    doc.header.read_access = [
      defaultContacts[1].address,
    ];

    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={doc}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={false}
            user={defaultUser}/>
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);
    expect(dataTable.length).toEqual(1);
    const rows = dataTable.find('tbody tr');
    expect(rows.length).toBe(2);
    const firstRowColumns = rows.at(0).find('td');
    const secondRowColumns = rows.at(1).find('td');
    expect(firstRowColumns.at(0).text()).toBe(defaultContacts[1].name);
    expect(secondRowColumns.at(0).text()).toBe(defaultContacts[0].name + ' (Last update)');

    //Should all all 3 actions: View, Edit, Remove
    const firstRowActions = firstRowColumns.at(2).find(Anchor);
    expect(firstRowActions.length).toBe(3);

    // Should only have only one action for the Owner
    const secondRowActions = secondRowColumns.at(2).find(Anchor);
    expect(secondRowActions.length).toBe(1);
    expect(secondRowActions.text()).toBe('View');

    const addCollaborator = component.find(Button).findWhere(node => node.key() === 'add-collaborator');
    expect(addCollaborator.length).toBe(1);
  });


  it('Should add a new collaborator', async () => {

    const doc: any = getDocument();
    const collaboratorToAdd = {
      ...defaultContacts[0],
      access: DOCUMENT_ACCESS.WRITE,
    };
    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={doc}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={false}
            user={defaultUser}/>
        </Formik>,
      ),
    );

    const addCollaborator = component.find(Button).findWhere(node => node.key() === 'add-collaborator');
    addCollaborator.simulate('click');

    const collaboratorForm = component.find(CollaboratorForm);
    await act(async () => {
      await collaboratorForm.prop('onSubmit')(collaboratorToAdd);
    });

    component.update();
    const columns = component.find(DataTable).find('tbody tr').at(0).find('td');
    expect(columns.at(0).text()).toBe(defaultContacts[0].name);
    expect(columns.at(1).text()).toBe(DOCUMENT_ACCESS.WRITE);


  });


  it('Should not add a new collaborator with unsupported DOCUMENT_ACCESS  ', async () => {

    const doc: any = getDocument();
    const collaboratorToAdd = {
      ...defaultContacts[0],
      access: 'some_access',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={doc}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={false}
            user={defaultUser}/>
        </Formik>,
      ),
    );

    const addCollaborator = component.find(Button).findWhere(node => node.key() === 'add-collaborator');
    addCollaborator.simulate('click');
    expect(component.find({title:'Add collaborator'}).find(Modal).length).toBe(1);
    const collaboratorForm = component.find(CollaboratorForm);
    expect(collaboratorForm.prop('submitLabel')).toBe('Add');
    expect(collaboratorForm.prop('viewMode')).toBe(false);

    await act(async () => {
      await collaboratorForm.prop('onSubmit')(collaboratorToAdd);
    });

    component.update();
    expect(component.find(DataTable).find('tbody tr').length).toBe(0);
  });

  it('Should remove a collaborator', () => {

    const doc: any = getDocument();
    doc.header.author = defaultContacts[0].address;
    doc.header.write_access = [
      defaultContacts[0].address,
    ];

    doc.header.read_access = [
      defaultContacts[1].address,
    ];

    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={doc}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={false}
            user={defaultUser}/>
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);

    const rows = dataTable.find('tbody tr');
    const firstRowColumns = rows.at(0).find('td');
    const removeAction = firstRowColumns.at(2).find(Anchor).at(2);
    removeAction.simulate('click');
    component.update();
    expect(component.find(DataTable).find('tbody tr').length).toBe(1);
  });

  it('Should edit', () => {

    const doc: any = getDocument();
    doc.header.author = defaultContacts[0].address;
    doc.header.write_access = [
      defaultContacts[0].address,
    ];

    doc.header.read_access = [
      defaultContacts[1].address,
    ];

    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={doc}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={false}
            user={defaultUser}/>
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);

    const rows = dataTable.find('tbody tr');
    const firstRowColumns = rows.at(0).find('td');
    const editAction = firstRowColumns.at(2).find(Anchor).at(1);
    editAction.simulate('click');
    expect(component.find({title:'Edit collaborator'}).find(Modal).length).toBe(1);
    const collaboratorForm = component.find(CollaboratorForm);
    expect(collaboratorForm.prop('submitLabel')).toBe('Update');
    expect(collaboratorForm.prop('viewMode')).toBe(false);

    expect(collaboratorForm.prop('selectedCollaborator')).toMatchObject({
      ...defaultContacts[1],
      access: DOCUMENT_ACCESS.READ,
    });

  });

  it('Should view', () => {

    const doc: any = getDocument();
    doc.header.author = defaultContacts[0].address;
    doc.header.write_access = [
      defaultContacts[0].address,
    ];

    doc.header.read_access = [
      defaultContacts[1].address,
    ];

    const component = mount(
      withAllProvidersAndContexts(
        <Formik
          initialValues={doc}
          onSubmit={() => {

          }}
        >
          <Collaborators
            contacts={defaultContacts}
            viewMode={false}
            user={defaultUser}/>
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);

    const rows = dataTable.find('tbody tr');
    const firstRowColumns = rows.at(0).find('td');
    const viewAction = firstRowColumns.at(2).find(Anchor).at(0);
    viewAction.simulate('click');
    expect(component.find({title:'View collaborator'}).find(Modal).length).toBe(1);
    const collaboratorForm = component.find(CollaboratorForm);
    expect(collaboratorForm.prop('submitLabel')).toBe('');
    expect(collaboratorForm.prop('viewMode')).toBe(true);

    expect(collaboratorForm.prop('selectedCollaborator')).toMatchObject({
      ...defaultContacts[1],
      access: DOCUMENT_ACCESS.READ,
    });

  });


});

