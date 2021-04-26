import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Anchor, Box, Button, CheckBox, Heading, Text } from 'grommet';
import { Modal } from '@centrifuge/axis-modal';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { formatDate } from '@centrifuge/gateway-lib/utils/formaters';
import { Preloader } from '../components/Preloader';
import SchemaForm from './SchemaForm';
import { httpClient } from '../http-client';
import { useMergeState } from '../hooks';
import {
  NOTIFICATION,
  NotificationContext,
} from '../components/NotificationContext';
import { PageError } from '../components/PageError';
import { AxiosError } from 'axios';
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight';
import { AuthContext } from '../auth/Auth';
import { goToHomePage } from '../utils/goToHomePage';

type State = {
  schemas: Schema[];
  loadingMessage: string | null;
  selectedSchema: Schema | null;
  showArchive: boolean;
  formMode: FormModes;
  openedSchemaForm: boolean;
  error: any;
};

/**
 * Holds the Schema form modes
 */
enum FormModes {
  EDIT = 'edit',
  CREATE = 'create',
  VIEW = 'view',
}

/**
 * Mapping for different states and components
 */
const formModePropMapping = {
  [FormModes.EDIT]: {
    schemaForm: {
      submitLabel: 'Update',
      readonly: false,
      infoParagraph: 'Please note that the schema must be a valid JSON object.',
    },
    modal: {
      title: 'Edit Schema',
    },
  },
  [FormModes.CREATE]: {
    schemaForm: {
      submitLabel: 'Create',
      readonly: false,
      infoParagraph: 'Please note that the schema must be a valid JSON object.',
    },
    modal: {
      title: 'Create Schema',
    },
  },
  [FormModes.VIEW]: {
    schemaForm: {
      submitLabel: '',
      readonly: true,
      infoParagraph: '',
    },
    modal: {
      title: 'View Schema',
    },
  },
};

const SchemaList: FunctionComponent = () => {
  const [
    {
      loadingMessage,
      selectedSchema,
      schemas,
      formMode,
      openedSchemaForm,
      showArchive,
      error,
    },
    setState,
  ] = useMergeState<State>({
    loadingMessage: 'Loading',
    schemas: [],
    selectedSchema: null,
    formMode: FormModes.CREATE,
    openedSchemaForm: false,
    showArchive: false,
    error: null,
  });

  const { token } = useContext(AuthContext);
  const notification = useContext(NotificationContext);

  const displayPageError = useCallback(
    error => {
      setState({
        loadingMessage: null,
        error,
      });
    },
    [setState],
  );

  const loadData = useCallback(async () => {
    setState({
      loadingMessage: 'Loading',
    });
    try {
      const schemas = (await httpClient.schemas.list(undefined, token!)).data;

      setState({
        loadingMessage: null,
        schemas,
      });
    } catch (e) {
      displayPageError(e);
    }
  }, [setState, displayPageError, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (schema: Schema) => {
    const context: any = {};
    if (selectedSchema && (selectedSchema as Schema)._id) {
      context.errorTitle = 'Failed to update schema';
      context.loadingMessage = 'Updating schema';
      context.method = 'update';
    } else {
      context.errorTitle = 'Failed to create schema';
      context.loadingMessage = 'creating schema';
      context.method = 'create';
    }

    setState({
      loadingMessage: context.loadingMessage,
      selectedSchema: null,
      openedSchemaForm: false,
    });

    try {
      await httpClient.schemas[context.method](schema, token!);
      await loadData();
    } catch (e) {
      setState({
        loadingMessage: null,
      });

      notification.alert({
        type: NOTIFICATION.ERROR,
        title: context.errorTitle,
        message: (e as AxiosError)!.response!.data.message,
      });
    }
  };

  const archiveSchema = async (schema: Schema) => {
    if (!schema._id)
      throw new Error('Can not archive a schema that does not have _id set');
    setState({
      loadingMessage: 'Archiving schema',
      selectedSchema: null,
    });
    try {
      await httpClient.schemas.archive(schema._id, token!);
      loadData();
    } catch (e) {
      setState({
        loadingMessage: null,
      });

      notification.alert({
        type: NOTIFICATION.ERROR,
        title: 'Failed to archive schema',
        message: (e as AxiosError)!.response!.data.message,
      });
    }
  };

  const restoreSchema = async (schema: Schema) => {
    if (!schema._id)
      throw new Error('Can not restore a schema that does not have _id set');
    setState({
      loadingMessage: 'Restoring schema',
      selectedSchema: null,
    });
    try {
      await httpClient.schemas.restore(schema._id, token!);
      loadData();
    } catch (e) {
      setState({
        loadingMessage: null,
      });

      notification.alert({
        type: NOTIFICATION.ERROR,
        title: 'Failed to restore schema',
        message: (e as AxiosError)!.response!.data.message,
      });
    }
  };

  const closeSchemaModal = () => {
    setState({ selectedSchema: null, openedSchemaForm: false });
  };

  const createSchema = () => {
    setState({
      selectedSchema: null,
      formMode: FormModes.CREATE,
      openedSchemaForm: true,
    });
  };

  const viewSchema = data => {
    setState({
      selectedSchema: data,
      formMode: FormModes.VIEW,
      openedSchemaForm: true,
    });
  };

  const editSchema = data => {
    setState({
      selectedSchema: data,
      formMode: FormModes.EDIT,
      openedSchemaForm: true,
    });
  };

  if (!token) {
    goToHomePage();
  }

  const renderSchemas = data => {
    return (
      <DataTableWithDynamicHeight
        data={data}
        primaryKey={'_id'}
        sortable={true}
        columns={[
          {
            property: 'name',
            header: 'Name',
            render: data => (data.name ? <Text>{data.name}</Text> : null),
          },
          {
            property: 'label',
            header: 'Label',
          },
          {
            property: 'createdAt',
            header: 'Date added',
            render: data =>
              data.createdAt ? <Text>{formatDate(data.createdAt)}</Text> : null,
          },
          {
            property: 'updatedAt',
            header: 'Date updated',
            render: data =>
              data.updatedAt ? <Text>{formatDate(data.updatedAt)}</Text> : null,
          },
          {
            property: 'actions',
            sortable: false,
            header: 'Actions',
            render: data => {
              let actions = [
                <Anchor
                  key={'view'}
                  label={'View'}
                  onClick={() => {
                    viewSchema(data);
                  }}
                />,
              ];

              if (!data.archived) {
                actions = [
                  ...actions,
                  <Anchor
                    key={'edit'}
                    label={'Edit'}
                    onClick={() => {
                      editSchema(data);
                    }}
                  />,
                  <Anchor
                    key={'archive'}
                    label={'Archive'}
                    onClick={() => {
                      archiveSchema(data);
                    }}
                  />,
                ];
              } else {
                actions = [
                  ...actions,
                  <Anchor
                    key={'restore'}
                    label={'Restore'}
                    onClick={() => {
                      restoreSchema(data);
                    }}
                  />,
                ];
              }
              return (
                <Box direction="row" gap="small">
                  {actions}
                </Box>
              );
            },
          },
        ]}
      />
    );
  };

  if (loadingMessage) {
    return <Preloader message={loadingMessage} />;
  }

  if (error) return <PageError error={error} />;

  return (
    <Box fill>
      <SecondaryHeader>
        <Heading level="3">Schemas</Heading>
        <Box direction={'row'} gap={'medium'}>
          <CheckBox
            label={'Show Archived'}
            checked={showArchive}
            onChange={event => setState({ showArchive: event.target.checked })}
          />
          <Button primary onClick={createSchema} label="Create Schema" />
        </Box>
      </SecondaryHeader>
      <Modal
        opened={openedSchemaForm}
        width={'xlarge'}
        headingProps={{ level: 3 }}
        {...formModePropMapping[formMode].modal}
        onClose={closeSchemaModal}
      >
        <SchemaForm
          {...formModePropMapping[formMode].schemaForm}
          selectedSchema={selectedSchema || Schema.getDefaultValues()}
          onSubmit={handleSubmit}
          onDiscard={closeSchemaModal}
        />
      </Modal>
      <Box pad={{ horizontal: 'medium' }}>
        {renderSchemas(
          schemas.filter(schema => showArchive === !!schema.archived),
        )}
      </Box>
    </Box>
  );
};

export default SchemaList;
