import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { connect } from 'react-redux';
import { Document } from '../common/models/document';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { LinkPrevious } from 'grommet-icons';
import routes from '../routes';
import { documentRoutes } from './routes';
import { Preloader } from '../components/Preloader';
import { SecondaryHeader } from '../components/SecondaryHeader';
import DocumentForm from './DocumentForm';
import { getDocumentById, resetGetDocumentById } from '../store/actions/documents';
import { getSchemasList, resetGetSchemasList } from '../store/actions/schemas';
import { Schema } from '../common/models/schema';
import { Contact } from '../common/models/contact';
import { canWriteToDoc, User } from '../common/models/user';


type Props = {
  getDocumentById: typeof getDocumentById
  resetGetDocumentById: typeof resetGetDocumentById;
  getContacts: typeof getContacts;
  resetGetContacts: typeof resetGetContacts;
  getSchemasList: typeof getSchemasList
  resetGetSchemasList: typeof resetGetSchemasList
  document: Document;
  loggedInUser: User;
  contacts: Contact[];
  schemas: Schema[];

} & RouteComponentProps<{ id: string }>;

export class ViewDocument extends React.Component<Props> {

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
  }

  render() {
    const {
      match: {
        params: {
          id,
        },
      },
      document,
      contacts,
      loggedInUser,
      schemas,
    } = this.props;

    if (!document || !contacts || !schemas || !document.attributes) {
      return <Preloader message="Loading"/>;
    }

    return (
      <>
        <Box pad={{ bottom: 'large' }}>
          <SecondaryHeader>
            <Box direction="row" gap="small" align="center">
              <Link to={routes.documents.index} size="large">
                <LinkPrevious/>
              </Link>

              <Heading level="3">
                Document #{document!.attributes!.reference_id!.value}
              </Heading>
            </Box>
            <Box direction="row" gap="medium">
              {canWriteToDoc(loggedInUser, document) && <Button
                onClick={() => {
                  this.props.history.push(
                    documentRoutes.edit.replace(':id', id),
                  );
                }}
                label="Edit"
              />}
            </Box>
          </SecondaryHeader>

          <DocumentForm
            document={document}
            mode={'view'}
            schemas={schemas}
            contacts={contacts}/>
        </Box>
      </>
    );

  }
}


const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
    document: state.documents.getById.data,
    contacts: state.contacts.get.data,
    schemas: state.schemas.getList.data,
  };
};

export default connect(
  mapStateToProps,
  {
    getContacts,
    resetGetContacts,
    getDocumentById,
    resetGetDocumentById,
    getSchemasList,
    resetGetSchemasList,

  },
)(withRouter(ViewDocument));


