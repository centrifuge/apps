import React from 'react';
import { Anchor, Box, Button, CheckBox, DataTable, Heading, Text } from 'grommet';
import { Modal } from '@centrifuge/axis-modal';
import { Schema } from '../../common/models/schema';
import { SecondaryHeader } from '../../components/SecondaryHeader';
import { formatDate } from '../../common/formaters';
import { connect } from 'react-redux';
import {
  archiveSchema,
  createSchema,
  getSchema,
  getSchemasList,
  resetCreateSchema,
  resetGetSchema,
  resetGetSchemasList,
  resetUpdateSchema,
  updateSchema,
} from '../../store/actions/schemas';
import { RequestState } from '../../store/reducers/http-request-reducer';
import { Preloader } from '../../components/Preloader';
import { RouteComponentProps, withRouter } from 'react-router';
import SchemasForm from './SchemasForm';


const mapStateToProps = (state: {
  schemas: {
    getList: RequestState<Schema[]>
  };
}) => {
  return {
    schemas: state.schemas.getList.data,
    loading: state.schemas.getList.loading,
  };
};

interface Props extends RouteComponentProps {
  schemas?: Schema[];
  getSchemasList: typeof getSchemasList;
  resetGetSchemasList: typeof resetGetSchemasList;
  resetCreateSchema: typeof resetCreateSchema;
  createSchema: typeof createSchema;
  getSchema: typeof getSchema;
  resetGetSchema: typeof resetGetSchema;
  updateSchema: typeof updateSchema;
  archiveSchema: typeof archiveSchema;
  resetUpdateSchema: typeof resetUpdateSchema;
  loading: boolean;
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
      infoParagraph: 'Please note that only edits to the registries will be saved. Any changes to the name or attributes of a schema will be discarded.',
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


interface State {
  selectedSchema: Schema | null;
  showArchive: boolean;
  formMode: FormModes;
  openedSchemaForm: boolean;
}


class SchemasList extends React.Component<Props, State> {
  state = {
    selectedSchema: null,
    formMode: FormModes.CREATE,
    openedSchemaForm: false,
    showArchive: false,
  };

  componentDidMount() {
    this.props.getSchemasList();
  }

  componentWillUnmount() {
    this.props.resetCreateSchema();
    this.props.resetUpdateSchema();
    this.props.resetGetSchema();
    this.props.resetGetSchemasList();
  }

  handleSubmit = (schema: Schema) => {
    const { selectedSchema } = this.state;
    if (selectedSchema && (selectedSchema as Schema)._id) {
      this.props.updateSchema(schema);
    } else {
      this.props.createSchema(schema);
    }

    this.closeSchemaModal();

  };

  archiveSchema = (schema: Schema) => {
    if (!schema._id) throw new Error('Can not archive a schema that does not have _id set');
    this.props.archiveSchema(schema._id);
  };

  closeSchemaModal = () => {
    this.setState({ selectedSchema: null, openedSchemaForm: false });
  };

  createSchema = () => {
    this.setState({
      selectedSchema: null,
      formMode: FormModes.CREATE,
      openedSchemaForm: true,
    });
  };

  viewSchema = (data) => {
    this.props.getSchema(data._id);
    this.setState({
      selectedSchema: data,
      formMode: FormModes.VIEW,
      openedSchemaForm: true,
    });
  };

  editSchema = (data) => {
    this.props.getSchema(data._id);
    this.setState({
      selectedSchema: data,
      formMode: FormModes.EDIT,
      openedSchemaForm: true,
    });
  };

  renderSchemas = (data) => {

    return (
      <DataTable
        data={data}
        primaryKey={'_id'}
        sortable={true}
        columns={[
          {
            property: 'name',
            header: 'Name',
            render: data =>
              data.name ? <Text>{data.name}</Text> : null,
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
            render: data => (
              <Box direction="row" gap="small">
                {/*Render actions for unarchived schemas*/}
                {!data.archived && [<Anchor
                  label={'Edit'}
                  onClick={() => {
                    this.editSchema(data);
                  }}
                />,
                  <Anchor
                    label={'Archive'}
                    onClick={() => {
                      this.archiveSchema(data);
                    }}
                  />]}
                {/*Render actions for archived schemas*/}
                {data.archived && [<Anchor
                  label={'View'}
                  onClick={() => {
                    this.viewSchema(data);
                  }}
                />]}
              </Box>
            ),
          },
        ]}
      />
    );
  };

  render() {

    if (this.props.loading || !this.props.schemas) {
      return <Preloader message="Loading"/>;
    }

    const { selectedSchema, formMode, openedSchemaForm, showArchive } = this.state;
    const { schemas } = this.props;

    return (
      <Box fill>
        <SecondaryHeader>
          <Heading level="3">Schemas</Heading>
          <Box direction={'row'} gap={'medium'}>
            <CheckBox
              label={'Show Archived'}
              checked={showArchive}
              onChange={(event) => this.setState({ showArchive: event.target.checked })}

            />
            <Button
              primary
              onClick={this.createSchema}
              label="Create Schema"
            />
          </Box>

        </SecondaryHeader>
        <Modal
          opened={openedSchemaForm}
          width={'xlarge'}
          headingProps={{ level: 3 }}
          {...formModePropMapping[formMode].modal}
          onClose={this.closeSchemaModal}
        >
          <SchemasForm
            {...formModePropMapping[formMode].schemaForm}
            selectedSchema={selectedSchema || Schema.getDefaultValues()}
            onSubmit={this.handleSubmit}
            onDiscard={this.closeSchemaModal}
          />
        </Modal>
        <Box pad={{ horizontal: 'medium' }}>
          {this.renderSchemas(
            schemas.filter(
              schema => showArchive === !!schema.archived,
            )
          )}
        </Box>
      </Box>
    );
  }
}

export default connect(
  mapStateToProps,
  {
    getSchemasList,
    resetGetSchemasList,
    getSchema,
    resetGetSchema,
    createSchema,
    resetCreateSchema,
    updateSchema,
    archiveSchema,
    resetUpdateSchema,
  },
)(withRouter(SchemasList));
