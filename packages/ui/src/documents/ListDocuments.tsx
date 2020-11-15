import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import documentRoutes from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import {
  Document,
  canLoadDocument,
  documentHasNFTs
} from '@centrifuge/gateway-lib/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { canCreateDocuments } from '@centrifuge/gateway-lib/models/user';
import { Preloader } from '../components/Preloader';
import { formatDate } from '@centrifuge/gateway-lib/utils/formaters';
import { httpClient } from '../http-client';
import { AppContext } from '../App';
import { useMergeState } from '../hooks';
import { PageError } from '../components/PageError';
import { DataTableWithDynamicHeight } from '../components/DataTableWithDynamicHeight';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { getSchemaLabel } from '@centrifuge/gateway-lib/utils/schema-utils';
import { FormNext } from 'grommet-icons';
import { POLLING_INTERVAL } from '../constants';

type Props = RouteComponentProps;

type State = {
  documents: Document[];
  schemas: Schema[];
  loadingMessage: string | null;
  error: any;
};

export const ListDocuments: FunctionComponent<Props> = (props: Props) => {
  const {
    history: { push },
  } = props;

  const [
    { loadingMessage, documents, schemas, error },
    setState,
  ] = useMergeState<State>({
    documents: [],
    schemas: [],
    loadingMessage: 'Loading',
    error: null,
  });

  const { user } = useContext(AppContext);

  const displayPageError = useCallback(
    error => {
      setState({
        loadingMessage: null,
        error,
      });
    },
    [setState],
  );

  const loadData = useCallback(
    async (inBg: boolean = false) => {
      setState({
        loadingMessage: inBg ? null : 'Loading',
      });
      try {
        const documents = (await httpClient.documents.list()).data;
        //get All schemas. We need to display even archived ones
        const schemas = (await httpClient.schemas.list()).data;
        setState({
          loadingMessage: null,
          schemas,
          documents,
        });
      } catch (e) {
        !inBg && displayPageError(e);
      }

      setTimeout(() => {
        loadData(true);
      }, POLLING_INTERVAL);
    },
    [setState, displayPageError],
  );

  const getFilteredDocuments = () => {
    return documents.map((doc: any) => {
      return {
        ...doc,
        // Datable does not have support for nested props ex data.myValue
        // We need make the props accessible top level and we use a special
        // prefix in order to avoid overriding some prop
        $_reference_id:
          doc.attributes.reference_id && doc.attributes.reference_id.value,
        $_schema:
          doc.attributes._schema &&
          getSchemaLabel(doc.attributes._schema.value, schemas),
      };
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loadingMessage) {
    return <Preloader message={loadingMessage} />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <Box>
      <SecondaryHeader>
        <Box direction={'row'} gap={'medium'} align="center">
          <Heading level="3">Documents</Heading>
        </Box>
        <Link to={documentRoutes.new}>
          {canCreateDocuments(user!) && (
            <Button primary label="Create Document" />
          )}
        </Link>
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        <DataTableWithDynamicHeight
          sortable={true}
          data={getFilteredDocuments()}
          onClickRow={({ datum }) => {
            if (!canLoadDocument(datum)) return;
            push(documentRoutes.view.replace(':id', datum._id));
          }}
          primaryKey={'_id'}
          columns={[
            {
              property: '$_reference_id',
              header: 'Reference ID',
              sortable: true,
            },

            {
              property: '$_schema',
              header: 'Schema',
              sortable: true,
            },
            {
              property: 'createdAt',
              header: 'Date created',
              sortable: true,
              render: datum => formatDate(datum.createdAt, true),
            },
            {
              property: 'document_status',
              header: 'Document Status',
              sortable: true,
            },
            {
              property: 'nft_status',
              header: 'NFT Status',
              sortable: true,
              render: datum => {
                if(documentHasNFTs(datum)) {
                    return datum.header.nfts.map(nft => nft.token_id).join(', ')
                }
                return datum.nft_status;
              }
            },
            {
              header: '',
              property: 'id',
              align: 'center',
              sortable: false,
              size: '36px',
              render: datum => {
                return canLoadDocument(datum) ? <FormNext /> : <></>;
              },
            },
          ]}
        />
      </Box>
    </Box>
  );
};

export default withRouter(ListDocuments);
