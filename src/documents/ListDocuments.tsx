import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Box, Button, DataTable, Heading } from 'grommet';
import documentRoutes from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import { Document } from '../common/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { canCreateDocuments, canWriteToDoc } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { formatDate } from '../common/formaters';
import { httpClient } from '../http-client';
import { AppContext } from '../App';
import { useMergeState } from '../hooks';
import { PageError } from '../components/PageError';


type Props = RouteComponentProps;

type State = {
  documents: Document[];
  loadingMessage: string | null;
  error: any;
}

export const ListDocuments: FunctionComponent<Props> = (props: Props) => {

  const {
    history: {
      push,
    },
  } = props;

  const [
    {
      loadingMessage,
      documents,
      error,
    },
    setState] = useMergeState<State>({
    documents: [],
    loadingMessage: 'Loading',
    error: null,
  });


  const { user } = useContext(AppContext);


  const displayPageError = useCallback((error) => {
    setState({
      loadingMessage: null,
      error,
    });
  }, [setState]);

  const loadData = useCallback(async () => {
    setState({
      loadingMessage: 'Loading',
    });
    try {

      const documents = (await httpClient.documents.list()).data;
      setState({
        loadingMessage: null,

        documents,
      });

    } catch (e) {
      displayPageError(e);
    }
  }, [setState, displayPageError]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loadingMessage) {
    return <Preloader message={loadingMessage}/>;
  }

  if (error) {
    return <PageError error={error}/>;
  }


  const sortableDocuments = documents.map((doc: any) => {
    return {
      ...doc,
      // Datable does not have support for nested props ex data.myValue
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
          {canCreateDocuments(user!) && <Button
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
              header: 'Reference ID',
            },

            {
              property: '$_schema',
              header: 'Schema',
            },

            {
              property: 'createdAt',
              header: 'Date created',
              render: datum => formatDate(datum.createdAt),
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
                      push(
                        documentRoutes.view.replace(':id', datum._id),
                      )
                    }
                  />
                  {canWriteToDoc(user!, datum) && <Anchor
                    label={'Edit'}
                    onClick={() =>
                      push(
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
};


export default withRouter(ListDocuments);
