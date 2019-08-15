import React from 'react';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { Modal } from '@centrifuge/axis-modal';
import { Schema } from "../../common/models/schema";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { formatDate } from "../../common/formaters";
import { connect } from "react-redux";
import {
  createSchema,
  getSchema,
  getSchemasList,
  resetCreateSchema,
  resetGetSchema,
  resetGetSchemasList,
  resetUpdateSchema,
  updateSchema
} from "../../store/actions/schemas";
import { RequestState } from "../../store/reducers/http-request-reducer";
import { Preloader } from "../../components/Preloader";
import { RouteComponentProps, withRouter } from "react-router";
import SchemasForm from "./SchemasForm";

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

type SchemasProps = {
  schemas?: Schema[];
  getSchemasList: typeof getSchemasList;
  resetGetSchemasList: typeof resetGetSchemasList;
  resetCreateSchema: typeof resetCreateSchema;
  createSchema: typeof createSchema;
  getSchema: typeof getSchema;
  resetGetSchema: typeof resetGetSchema;
  updateSchema: typeof updateSchema;
  resetUpdateSchema: typeof resetUpdateSchema;
  loading: boolean;
};

const createTitle = "Create New Schema";
const updateTitle = "View/Edit Existing Schema";

class SchemasList extends React.Component<RouteComponentProps & SchemasProps> {
  state = {
    selectedSchema: null,
    createSchema: false,
    viewSchema: false,
    isEditing: false,
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

  handleSubmit = (input) => {
    const schemaString = input.replace(/\r?\n|\r|\t/g, '');
    let schema: Schema =  JSON.parse(schemaString);

    if (this.state.isEditing) {
      this.props.updateSchema(schema);
      this.closeViewSchema();
    } else {
      this.props.createSchema(schema);
      this.closeCreateSchema();
    }

  };

  closeCreateSchema = () => {
    this.setState({ createSchema: false });
  };

  closeViewSchema = () => {
    this.setState({ viewSchema: false });
  };

  onAddNewClick = () => {
    this.setState({
      createSchema: true,
      isEditing: false,
    });
  };

  onViewSchemaClick = (data) => {
    this.props.getSchema(data._id);
    this.setState({
      selectedSchema: data,
      viewSchema: true,
      isEditing: true,
    });
  };

  renderSchemas = (data) => {

    return (
        <DataTable
            data={data}
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
                property: '_id',
                header: 'Actions',
                render: data => (
                    <Box direction="row" gap="small">
                      <Anchor
                          label={'View/Update'}
                          onClick={ async () => { await this.onViewSchemaClick(data)} }
                      />
                    </Box>
                ),
              },
            ]}
        />
    );
  };

  render() {

    if (this.props.loading) {
      return <Preloader message="Loading"/>;
    }

    const { createSchema, viewSchema, selectedSchema, isEditing } = this.state;
    const { schemas } = this.props;

    return (
        <Box fill>
          <SecondaryHeader>
            <Heading level="3">Schemas</Heading>
            <Button
                primary
                onClick={this.onAddNewClick}
                label="Add Schema"
            />
          </SecondaryHeader>
          <Modal
              opened={ isEditing ? viewSchema :  createSchema }
              width={'xlarge'}
              headingProps={{ level: 3 }}
              title={ isEditing ? updateTitle : createTitle }
              onClose={ isEditing ?  this.closeViewSchema : this.closeCreateSchema }
          >
            <SchemasForm
                isEditing={isEditing}
                selectedSchema={ isEditing ? selectedSchema : Schema.getDefaultValues() }
                onSubmit={this.handleSubmit}
                onDiscard={ isEditing ? this.closeViewSchema : this.closeCreateSchema }
            />
          </Modal>
         <Box pad={{horizontal:"medium"}}>
            { this.renderSchemas(schemas) }
         </Box>
        </Box>
    )
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
      resetUpdateSchema,
    },
)(withRouter(SchemasList));
