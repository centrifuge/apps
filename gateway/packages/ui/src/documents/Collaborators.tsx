import React, { FunctionComponent } from 'react';
import { useMergeState } from '../hooks';
import { Modal } from '@centrifuge/axis-modal';
import {
  createDocumentCollaborators,
  Document,
  getDocumentCollaborators,
} from '@centrifuge/gateway-lib/models/document';
import { getAddressLink } from '@centrifuge/gateway-lib/utils/etherscan';
import { Section } from '../components/Section';
import { Anchor, Box, Button, Paragraph, Text } from 'grommet';
import { DisplayField } from '@centrifuge/axis-display-field';
import { UserAdd } from 'grommet-icons';
import { Contact } from '@centrifuge/gateway-lib/src/models/contact';
import { connect, FormikContext } from 'formik';
import { Collaborator } from '@centrifuge/gateway-lib/models/collaborator';
import CollaboratorForm from './CollaboratorForm';
import { canWriteToDoc } from '@centrifuge/gateway-lib/models/user';
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight';

interface OuterProps {
  contacts: Contact[],
  collaborators: Collaborator[],
  viewMode: boolean,
  addCollaboratorToPayload: (collaborators: Array<any>) => void
}


type Props = OuterProps & {
  formik: FormikContext<Document>
};


type State = {
  collaboratorModelOpened: boolean
  formMode: FormModes
  selectedCollaborator?: Collaborator
}

/**
 * Holds the Schema form modes
 */
enum FormModes {
  EDIT = 'edit',
  ADD = 'add',
  VIEW = 'view',
}


/**
 * Mapping for different states and components
 */
const formModePropMapping = {
  [FormModes.EDIT]: {
    form: {
      submitLabel: 'Update',
      viewMode: false,
    },
    modal: {
      title: 'Edit collaborator',
    },
  },
  [FormModes.ADD]: {
    form: {
      submitLabel: 'Add',
      viewMode: false,
    },
    modal: {
      title: 'Add collaborator',
    },
  },
  [FormModes.VIEW]: {
    form: {
      submitLabel: '',
      viewMode: true,
      infoParagraph: '',
    },
    modal: {
      title: 'View collaborator',
    },
  },

};

export const Collaborators: FunctionComponent<Props> = (props) => {

  const [{
    collaboratorModelOpened,
    selectedCollaborator,
    formMode,
  }, setState] = useMergeState<State>({
    collaboratorModelOpened: false,
    formMode: FormModes.ADD,
  });

  const {
    addCollaboratorToPayload,
    viewMode,
    contacts,
    collaborators,
    formik: {
      values,
      setFieldValue,
    },
  } = props;

  // Merge schema collaborators with available contacts
  let contactsInstance = getDocumentCollaborators(values, contacts.concat(collaborators));

  // Schema provided collaborators cannot replace used contacts
  // The unique criteria is the address
  if (collaborators) {
    contactsInstance = contactsInstance.concat(collaborators.filter(
      collaborator => ! contactsInstance.find(
        contact => collaborator.address.toLowerCase() === contact.address.toLowerCase())
    ));

    addCollaboratorToPayload(contactsInstance)
  }

  const openCollaboratorFormInAddMode = () => {
    setState({
      selectedCollaborator: undefined,
      formMode: FormModes.ADD,
      collaboratorModelOpened: true,
    });
  };

  const lastUpdatedBy = (collaborator: Collaborator) => {
    return values &&
      values.header &&
      values.header.author &&
      values.header.author.toLowerCase() === collaborator.address.toLowerCase();
  };

  const openCollaboratorFormInViewMode = (selectedCollaborator) => {
    setState({
      selectedCollaborator,
      formMode: FormModes.VIEW,
      collaboratorModelOpened: true,
    });
  };

  const openCollaboratorFormInEditMode = (selectedCollaborator) => {
    setState({
      selectedCollaborator,
      formMode: FormModes.EDIT,
      collaboratorModelOpened: true,
    });
  };

  const closeModal = () => {
    setState({
      collaboratorModelOpened: false,
    });
  };

  const removeCollaborator = (collaborator: Collaborator) => {
    updateCollaborators(contactsInstance.filter(c => {
      return c.address.toLowerCase() !== collaborator.address.toLowerCase();
    }) as Collaborator[]);
  };

  const addCollaborator = (collaborator: Collaborator) => {
    //first we need to remove collaborator from other access lists
    setState({
      collaboratorModelOpened: false,
    });
    updateCollaborators([
      ...contactsInstance.filter(c => {
        return c.address.toLowerCase() !== collaborator.address.toLowerCase();
      }),
      collaborator,
    ] as Collaborator[]);
  };

    const updateCollaborators = (collaborators: Collaborator[]) => {
    const accessLists = createDocumentCollaborators(collaborators);
    setFieldValue('header', {
      ...values.header,
      ...accessLists,
    });
  };

  const collaboratorActions = !viewMode ? [
    <Button key="add-collaborator" onClick={openCollaboratorFormInAddMode} icon={<UserAdd/>} plain
            label={'Add collaborator'}/>,
  ] : [];

  const renderCollaborators = () => {
    return (<Section
      title="Collaborators"
      actions={collaboratorActions}
    >

      <DataTableWithDynamicHeight
        size={'360px'}
        sortable={true}
        data={contactsInstance}
        primaryKey={'address'}
        columns={[
          {
            property: 'name',
            header: 'Name',
            render: (datum: Collaborator) => {
              return <Text>{datum.name}{lastUpdatedBy(datum) && <Text weight={'bold'}> (Last update)</Text>}</Text>;
            },
          },
          {
            sortable: false,
            property: 'address',
            header: 'Address',
            render: (datum: Collaborator) => <DisplayField
              copy={true}
              as={'span'}
              link={{
                href: getAddressLink(datum.address),
                target: '_blank',
              }}
              value={datum.address}/>,

          },
          {
            property: 'access',
            header: 'Access',
          },
          {
            property: '_id',
            header: 'Actions',
            sortable: false,
            render: (datum: Collaborator) => {
              return <Box className={'actions'} direction="row" gap="small">
                <Anchor
                  label={'View'}
                  onClick={() => {
                    openCollaboratorFormInViewMode(datum);
                  }}
                />
                {(!viewMode && canWriteToDoc({ account: datum.address }, values)) && [
                  <Anchor
                    key={'edit-anchor'}
                    label={'Edit'}
                    onClick={() => {
                      openCollaboratorFormInEditMode(datum);
                    }}
                  />,
                  <Anchor
                    key={'remove-anchor'}
                    label={'Remove'}
                    onClick={() => {
                      removeCollaborator(datum);
                    }}
                  />,
                ]}

              </Box>;
            },
          },
        ]}
      />
      {!contactsInstance.length &&
      <Paragraph color={'dark-2'}>There are no collaborators agreements yet.</Paragraph>}
    </Section>);
  };

  return <>
    <Modal
      width={'large'}
      opened={collaboratorModelOpened}
      headingProps={{ level: 3 }}
      title={formModePropMapping[formMode].modal.title}

      onClose={closeModal}
    >
      <CollaboratorForm
        selectedCollaborator={selectedCollaborator}
        viewMode={formModePropMapping[formMode].form.viewMode}
        submitLabel={formModePropMapping[formMode].form.submitLabel}
        onSubmit={addCollaborator}
        onDiscard={closeModal}
        contacts={contacts}/>
    </Modal>

    {renderCollaborators()}

  </>;
};

export default connect<OuterProps>(Collaborators);
