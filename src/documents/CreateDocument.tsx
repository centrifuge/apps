import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import DocumentForm from './DocumentForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';
import { Box, Button, Heading } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { Preloader } from '../components/Preloader';
import { RequestState } from '../store/reducers/http-request-reducer';
import { CoreapiDocumentResponse, InvInvoiceData } from '../../clients/centrifuge-node';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { getUserSchemas, mapContactsToLabelKeyPair } from '../store/derived-data';
import { documentRoutes } from './routes';
import { Schema } from '../common/models/schema';
import { getSchemasList, resetGetSchemasList } from '../store/actions/schemas';
import { createDocument, resetCreateDocument } from '../store/actions/documents';

type Props = {
  createDocument: typeof createDocument;
  resetCreateDocument: typeof resetCreateDocument;
  getContacts: typeof getContacts;
  resetGetContacts: typeof resetGetContacts;
  getSchemasList: typeof getSchemasList;
  resetGetSchemasList: typeof resetGetSchemasList;
  creatingDocument: RequestState<InvInvoiceData>;
  contacts?: LabelValuePair[];
  schemas?: Schema[];
} & RouteComponentProps;


type State = {
  defaultDocument: CoreapiDocumentResponse
}

export class CreateDocument extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.state = {
      defaultDocument: {},
    };
  }

  componentDidMount() {
    if (!this.props.contacts) {
      this.props.getContacts();
      this.props.getSchemasList();
    }
  }

  componentWillUnmount() {
    this.props.resetGetSchemasList();
    this.props.resetGetContacts();
  }

  createDocument = (document: CoreapiDocumentResponse) => {
    this.props.createDocument(document);
    this.setState({
      defaultDocument: document,
    });
  };

  onCancel = () => {
    this.props.history.push(documentRoutes.index);
  };

  render() {

    const { creatingDocument, contacts, schemas } = this.props;
    const { defaultDocument } = this.state;

    if (!this.props.contacts || !schemas!.length) {
      return <Preloader message="Loading"/>;
    }

    if (creatingDocument.loading) {
      return <Preloader message="Saving document" withSound={true}/>;
    }

    return (
      <DocumentForm
        document={defaultDocument}
        schemas={schemas}
        onSubmit={this.createDocument}
        contacts={contacts}
      >
        <SecondaryHeader>
          <Box direction="row" gap="small" align="center">
            <Link to={documentRoutes.index} size="large">
              <LinkPrevious/>
            </Link>
            <Heading level="3">
              {'New Document'}
            </Heading>
          </Box>

          <Box direction="row" gap="medium">
            <Button
              onClick={this.onCancel}
              label="Discard"
            />

            <Button
              type="submit"
              primary
              label="Save"
            />
          </Box>
        </SecondaryHeader>
      </DocumentForm>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    creatingDocument: state.documents.create,
    contacts: mapContactsToLabelKeyPair(state),
    schemas: getUserSchemas(state),
  };
};

export default connect(
  mapStateToProps,
  {
    createDocument,
    resetCreateDocument,
    getContacts,
    resetGetContacts,
    getSchemasList,
    resetGetSchemasList,
  },
)(withRouter(CreateDocument));


