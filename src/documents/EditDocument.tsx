import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import DocumentForm from './DocumentForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { Box, Button, Heading, Paragraph } from 'grommet';
import { documentRoutes } from './routes';
import { LinkPrevious } from 'grommet-icons';
import { canWriteToDoc, User } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { RequestState } from '../store/reducers/http-request-reducer';
import { Document } from '../common/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { getDocumentById, resetGetDocumentById, resetUpdateDocument, updateDocument } from '../store/actions/documents';
import { getSchemasList, resetGetSchemasList } from '../store/actions/schemas';
import { Schema } from '../common/models/schema';
import { Contact } from '../common/models/contact';

type Props = {
  updateDocument: typeof updateDocument;
  resetUpdateDocument: typeof resetUpdateDocument;
  getDocumentById: typeof getDocumentById
  resetGetDocumentById: typeof resetGetDocumentById
  getSchemasList: typeof getSchemasList
  resetGetSchemasList: typeof resetGetSchemasList
  getContacts: typeof getContacts;
  resetGetContacts: typeof getContacts;
  document?: Document;
  schemas: Schema[];
  contacts?: Contact[];
  loggedInUser: User;
  updatingDocument: RequestState<Document>;
} & RouteComponentProps<{ id?: string }>;

export class EditDocument extends React.Component<Props> {
  componentDidMount() {
    if (this.props.match.params.id) {
      this.props.getContacts();
      this.props.getSchemasList();
      this.props.getDocumentById(this.props.match.params.id);
    }
  }

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetSchemasList();
    this.props.resetGetDocumentById();
    this.props.resetUpdateDocument();
  }

  updateDocument = (document: Document) => {
    this.props.updateDocument(document);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    const {
      updatingDocument,
      contacts,
      document,
      schemas,
      loggedInUser,
    } = this.props;

    if (!document || !contacts || !schemas) {
      return <Preloader message="Loading"/>;
    }

    if (updatingDocument.loading) {
      return <Preloader message="Updating document" withSound={true}/>;
    }
    // TODO add route resolvers and remove this logic
    if(!canWriteToDoc(loggedInUser,document)) {
      return <Paragraph color="status-error"> Access Denied! </Paragraph>;
    }

    return (
      <DocumentForm
        onSubmit={this.updateDocument}
        mode={'edit'}
        contacts={contacts}
        document={document}
        schemas={schemas}
      >
        <SecondaryHeader>
          <Box direction="row" gap="small" align="center">
            <Link to={documentRoutes.index} size="large">
              <LinkPrevious/>
            </Link>
            <Heading level="3">
              {'Update Document'}
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
              label="Update"
            />
          </Box>
        </SecondaryHeader>
      </DocumentForm>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
    document: state.documents.getById.data,
    updatingDocument: state.documents.update,
    contacts: state.contacts.get.data,
    schemas: state.schemas.getList.data,
  };
};

export default connect(
  mapStateToProps,
  {
    updateDocument,
    resetUpdateDocument,
    getContacts,
    resetGetContacts,
    getDocumentById,
    resetGetDocumentById,
    getSchemasList,
    resetGetSchemasList,
  },
)(withRouter(EditDocument));
