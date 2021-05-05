import React from 'react';
import { mount } from 'enzyme';
import { Anchor, Button, DataTable } from 'grommet';
import { defaultCollaborators, defaultContacts, defaultUser } from '../../test-utilities/default-data';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import Collaborators from '../Collaborators';
import { Formik } from 'formik';
import CollaboratorForm from '../CollaboratorForm';
import { act } from 'react-dom/test-utils';
import { DOCUMENT_ACCESS, DocumentStatus, NftStatus } from '@centrifuge/gateway-lib/models/document';
import { Modal } from '@centrifuge/axis-modal';


describe('Collaborators', () => {

  const getDocument = () => {
    return {
      _id: 'first_id',
      nft_status: NftStatus.NoNft,
      document_status: DocumentStatus.Created,
      header: {
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

  const addCollaboratorToPayload = jest.fn(() => {
  });

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
            collaborators={[]}
            viewMode={true}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
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
            collaborators={[]}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
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

    // When reading the collaborators they will be sorted. The order of the list will be read_access collabs and
    // after that write_access

    // should have only view because it has read access
    const firstRowActions = firstRowColumns.at(2).find(Anchor);
    expect(firstRowActions.length).toBe(1);
    expect(firstRowActions.text()).toBe('View');

    //Should all all 3 actions: View, Edit, Remove because it has write access
    const secondRowActions = secondRowColumns.at(2).find(Anchor);
    expect(secondRowActions.length).toBe(3);



    const addCollaborator = component.find(Button).findWhere(node => node.key() === 'add-collaborator');
    expect(addCollaborator.length).toBe(1);
  });


  it('Should render 3 collaborators from the props', () => {

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
            collaborators={defaultCollaborators}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);
    expect(dataTable.length).toEqual(1);
    const rows = dataTable.find('tbody tr');
    expect(rows.length).toBe(3);
    const firstRowColumns = rows.at(0).find('td');
    const secondRowColumns = rows.at(1).find('td');
    expect(firstRowColumns.at(0).text()).toBe(defaultCollaborators[1].name);
    expect(secondRowColumns.at(0).text()).toBe(defaultCollaborators[0].name + ' (Last update)');
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
            collaborators={[]}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
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
            collaborators={[]}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
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
            collaborators={[]}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);

    const rows = dataTable.find('tbody tr');
    const columnWithWriteAccess = rows.at(1).find('td');
    const removeAction = columnWithWriteAccess.at(2).find(Anchor).at(2);
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
            collaborators={[]}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
        </Formik>,
      ),
    );
    const dataTable = component.find(DataTable);

    const rows = dataTable.find('tbody tr');
    const columnWithWriteAccess = rows.at(1).find('td');
    const editAction = columnWithWriteAccess.at(2).find(Anchor).at(1);
    editAction.simulate('click');
    expect(component.find({title:'Edit collaborator'}).find(Modal).length).toBe(1);
    const collaboratorForm = component.find(CollaboratorForm);
    expect(collaboratorForm.prop('submitLabel')).toBe('Update');
    expect(collaboratorForm.prop('viewMode')).toBe(false);

    expect(collaboratorForm.prop('selectedCollaborator')).toMatchObject({
      ...defaultContacts[0],
      access: DOCUMENT_ACCESS.WRITE,
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
            collaborators={[]}
            viewMode={false}
            addCollaboratorToPayload={addCollaboratorToPayload}
          />
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

