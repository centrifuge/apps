import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Anchor, Box, Button, DataTable, Heading } from 'grommet';
import { documentRoutes } from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import { Document } from '../common/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { getDocuments, resetGetDocuments } from '../store/actions/documents';
import { canCreateDocuments, canWriteToDoc, User } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { formatDate } from '../common/formaters';


type Props = {
  getDocuments: typeof getDocuments;
  resetGetDocuments: typeof resetGetDocuments;
  documents: Document[];
  loading: boolean;
  loggedInUser: User;
  error: any;
};

export class ListDocuments extends React.Component<Props & RouteComponentProps> {

  componentWillMount() {
    this.props.getDocuments();
  }

  componentWillUnmount() {
    this.props.resetGetDocuments();
  }


  render() {

    const { loading, documents, history, loggedInUser } = this.props;

    if (loading) {
      return <Preloader message="Loading"/>;
    }


    const sortableDocuments = documents.map((doc: any) => {
      return {
        ...doc,
        // Datable does suport suported for nested props ex data.myValue
        // We need make the props accessible top level and we use a special
        // prefix in order to avoid overriding some prop
        $_reference_id: doc.attributes.reference_id && doc.attributes.reference_id.value,
        $_schema: doc.attributes._schema && doc.attributes._schema.value,
      };
    });

    return (
      <Box>
        <SecondaryHeader>
          <Heading level="3">Documents</Heading>
          <Link to={documentRoutes.new}>
            {canCreateDocuments(loggedInUser) && <Button
              primary
              label="Create Document"
            />}
          </Link>
        </SecondaryHeader>

        <Box pad={{ horizontal: 'medium' }}>
          <DataTable
            sortable={true}
            data={sortableDocuments}
            primaryKey={'_id'}
            columns={[
              {
                property: '$_reference_id',
                header: 'Reference number',
                sortable: true,
              },

              {
                property: '$_schema',
                header: 'Schema',
              },

              {
                property: 'createdAt',
                header: 'Date created',
                sortable: true,
                render: datum => formatDate(datum.createdAt)
              },
              {
                property: '_id',
                header: 'Actions',
                sortable: false,
                render: datum => (
                  <Box direction="row" gap="small">
                    <Anchor
                      label={'View'}
                      onClick={() =>
                        history.push(
                          documentRoutes.view.replace(':id', datum._id),
                        )
                      }
                    />
                    {canWriteToDoc(loggedInUser, datum) && <Anchor
                      label={'Edit'}
                      onClick={() =>
                        history.push(
                          documentRoutes.edit.replace(':id', datum._id),
                        )
                      }
                    />}
                  </Box>
                ),
              },
            ]}
          />
        </Box>
      </Box>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
    documents: state.documents.get.data || [],
    loading: state.documents.get.loading,
    error: state.documents.get.error,
  };
};

export default connect(
  mapStateToProps,
  {
    getDocuments,
    resetGetDocuments,
  },
)(withRouter(ListDocuments));
