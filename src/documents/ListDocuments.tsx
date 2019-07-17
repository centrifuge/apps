import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Anchor, Box, Button, DataTable, Heading } from 'grommet';
import { documentRoutes } from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import { formatDate } from '../common/formaters';
import { Document } from '../common/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { getDocuments, resetGetDocuments } from '../store/actions/documents';
import { User } from '../common/models/user';
import { Preloader } from '../components/Preloader';


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

    const {loading, documents,loggedInUser, history} = this.props;

    if (loading) {
      return <Preloader message="Loading"/>;
    }

    return (
      <Box>
        <SecondaryHeader>
          <Heading level="3">Documents</Heading>
          <Link to={documentRoutes.new}>
            {loggedInUser.schemas.length > 0 && <Button
              primary
              label="Create Document"
            />}
          </Link>
        </SecondaryHeader>

        <Box pad={{ horizontal: 'medium' }}>
          <DataTable
            sortable={false}
            data={documents}
            primaryKey={'_id'}
            columns={[
              {
                property: 'attributes.reference_id',
                header: 'Reference number',
                render: datum => datum.attributes.reference_id && datum.attributes.reference_id.value,
              },

              {
                property: 'schema',
                header: 'Schema',
                render: datum => datum.attributes._schema && datum.attributes._schema.value,
              },

              {
                property: 'date_created',
                header: 'Date created',
                render: datum => {
                  return formatDate(datum.createdAt);
                },
              },
              {
                property: '_id',
                header: 'Actions',
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
                    <Anchor
                      label={'Edit'}
                      onClick={() =>
                        history.push(
                          documentRoutes.edit.replace(':id', datum._id),
                        )
                      }
                    />
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
