import React from 'react';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { Modal } from '@centrifuge/axis-modal';
import { Schema } from "../../common/models/schema";
import SchemasCreationForm from "./SchemasCreationForm";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { formatDate } from "../../common/formaters";
// import { schemasRoutes } from "./routes";
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

const mapStateToProps = (state: {
  schemas: { getList: RequestState<Schema[]> };
}) => {
  return {
    schemas: state.schemas.getList.data,
    loading: state.schemas.getList.loading,
  };
};

type SchemasProps = {
  schemas?: Schema[];
  getSchemasList: () => void;
  resetGetSchemasList: () => void;
  resetCreateSchema: () => void;
  createSchema: (schema: Schema) => void;
  getSchema: () => void;
  resetGetSchema: () => void;
  updateSchema: (schema: Schema) => void;
  resetUpdateSchema: () => void;
  loading: boolean;
};

const emptySchemaInput = {
  json: {
    name: "",
    attributes: [],
    registries:[],
  }
}

class SchemasList extends React.Component<SchemasProps> {
  state = {
    createSchema: false,
  };

  componentDidMount() {
    this.props.getSchemasList();
  }

  componentWillUnmount() {
    this.props.resetCreateSchema();
    // this.props.resetGetSchema();
    // this.props.resetUpdateSchema();
  }

  createSchema = (input) => {
    const schemaInput = input.json
    const schemaString = schemaInput.replace(/\r?\n|\r|\t/g, '')
    const schemaJSON = JSON.parse(schemaString)
    let schema = new Schema(
        schemaJSON.name,
        schemaJSON.attributes,
        schemaJSON.registries
    )
    this.props.createSchema(schema);
    this.closeCreateSchema();
  };

  closeCreateSchema = () => {
    this.setState({ createSchema: false });
  };

  onAddNewClick = () => {
    this.setState({
      createSchema: true,
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
                          label={'View'}
                          onClick={() =>
                              console.log('view')
                              // this.props.history.push(
                              //     schemaRoutes.view.replace(':id', data._id),
                              // )
                          }
                      />
                      <Anchor
                          label={'Update'}
                          onClick={() =>
                              console.log('edit')
                              // this.props.history.push(
                              //     schemaRoutes.edit.replace(':id', data._id),
                              // )
                          }
                      />
                    </Box>
                ),
              },
            ]}
        />
    );
  }

  render() {

    if (this.props.loading) {
      return <Preloader message="Loading"/>;
    }

    const { createSchema } = this.state;
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
            opened={createSchema}
            headingProps={{ level: 3 }}
            title={`Create new schema`}
            onClose={this.closeCreateSchema}
          >
            <SchemasCreationForm
              schema={emptySchemaInput}
              onSubmit={this.createSchema}
              onDiscard={this.closeCreateSchema}
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
)(SchemasList);