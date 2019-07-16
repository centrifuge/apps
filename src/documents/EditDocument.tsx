import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import DocumentForm from './DocumentForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';
import { Box, Button, Heading } from 'grommet';
import { documentRoutes } from './routes';
import { LinkPrevious } from 'grommet-icons';
import { User } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { RequestState } from '../store/reducers/http-request-reducer';
import { CoreapiDocumentResponse } from '../../clients/centrifuge-node';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { mapContactsToLabelKeyPair } from '../store/derived-data';
import { getDocumentById, resetGetDocumentById, resetUpdateDocument, updateDocument } from '../store/actions/documents';
import { getSchemasList, resetGetSchemasList } from '../store/actions/schemas';
import { Schema } from '../common/models/schema';

type Props = {
  updateDocument: typeof updateDocument;
  resetUpdateDocument: typeof resetUpdateDocument;
  getDocumentById: typeof getDocumentById
  resetGetDocumentById: typeof resetGetDocumentById
  getSchemasList: typeof getSchemasList
  resetGetSchemasList: typeof resetGetSchemasList
  getContacts: typeof getContacts;
  resetGetContacts: typeof getContacts;
  document?: CoreapiDocumentResponse;
  schemas: Schema[];
  contacts?: LabelValuePair[];
  loggedInUser: User;
  updatingDocument: RequestState<CoreapiDocumentResponse>;
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

  updateDocument = (document: CoreapiDocumentResponse) => {
    this.props.updateDocument(document);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    const { updatingDocument, contacts, document, schemas } = this.props;

    if (!document || !contacts || !schemas) {
      return <Preloader message="Loading"/>;
    }

    if (updatingDocument.loading) {
      return <Preloader message="Updating document" withSound={true}/>;
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
    contacts: mapContactsToLabelKeyPair(state),
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
