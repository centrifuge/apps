import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Document } from '@centrifuge/gateway-lib/models/document';
import { RouteComponentProps, withRouter } from 'react-router';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { Contact, extendContactsWithUsers } from '@centrifuge/gateway-lib/models/contact';
import { canWriteToDoc } from '@centrifuge/gateway-lib/models/user';
import { httpClient } from '../http-client';
import { AppContext } from '../App';
import { useMergeState } from '../hooks';
import { PageError } from '../components/PageError';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { Box, Button, Heading } from 'grommet';
import routes from '../routes';
import { LinkPrevious } from 'grommet-icons';
import documentRoutes from './routes';
import DocumentForm from './DocumentForm';
import { Preloader } from '../components/Preloader';
import { Nfts } from './Nfts';
import { FundingAgreements } from './FundingAgreements';
import { AxiosError } from 'axios';
import { NOTIFICATION, NotificationContext } from '../components/NotificationContext';

type Props = RouteComponentProps<{ id: string }>

type State = {
  loadingMessage: string | null;
  document?: Document;
  contacts: Contact[];
  schemas: Schema[];
  error: any,
}

export const ViewDocument: FunctionComponent<Props> = (props: Props) => {

  const [{
    loadingMessage,
    contacts,
    document,
    schemas,
    error,
  }, setState] = useMergeState<State>({
    loadingMessage: 'Loading',
    contacts: [],
    schemas: [],
    error: null,
  });


  const {
    match: {
      params: {
        id,
      },
    },
    history: {
      push,
    },
  } = props;


  const { user } = useContext(AppContext);
  const notification = useContext(NotificationContext);

  const displayPageError = useCallback((error) => {
    setState({
      loadingMessage: null,
      error,
    });
  }, [setState]);

  const startLoading = (loadingMessage: string = 'Loading') => {
    setState({ loadingMessage });
  };

  const displayModalError = (e: AxiosError, title: string = 'Error') => {
    setState({
      loadingMessage: null,
    });
    notification.alert({
      type: NOTIFICATION.ERROR,
      title,
      message: e!.response!.data.message,
    });
  };

  const loadData = useCallback(async () => {
    setState({
      loadingMessage: 'Loading',
    });
    try {
      const contacts = (await httpClient.contacts.list()).data;
      const schemas = (await httpClient.schemas.list()).data;
      const document = (await httpClient.documents.getById(id)).data;
      setState({
        loadingMessage: null,
        contacts,
        schemas,
        document,
      });

    } catch (e) {
      displayPageError(e);
    }
  }, [id, setState, displayPageError]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  if (loadingMessage) return <Preloader message={loadingMessage}/>;
  if (error) return <PageError error={error}/>;

  const selectedSchema: Schema | undefined = !document ? undefined : schemas.find(s => {
    return !!(
      document.attributes &&
      document.attributes._schema &&
      s.name === document.attributes._schema.value
    );
  });

  const extendedContacts = extendContactsWithUsers(contacts, [user!]);
  return (
    <Box pad={{ bottom: 'large' }}>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link to={routes.documents.index}>
            <LinkPrevious/>
          </Link>

          <Heading level="3">
            Document #{document!.attributes!.reference_id!.value}
          </Heading>
        </Box>
        <Box direction="row" gap="medium">
          {canWriteToDoc(user, document) && document && document.header  && <Button
            primary={true}
            onClick={() => {
              push(
                documentRoutes.edit.replace(':id', id),
              );
            }}
            label="Edit"
          />}
        </Box>
      </SecondaryHeader>

      <DocumentForm
        selectedSchema={selectedSchema}
        document={document}
        mode={'view'}
        schemas={schemas}
        contacts={extendedContacts}>

        <Nfts
          viewMode={true}
          onAsyncStart={startLoading}
          onAsyncComplete={loadData}
          onAsyncError={displayModalError}
          document={document!}
          contacts={contacts}
          registries={selectedSchema!.registries}/>

        {(selectedSchema!.formFeatures && selectedSchema!.formFeatures!.fundingAgreement) && <FundingAgreements
          onAsyncStart={startLoading}
          onAsyncComplete={loadData}
          onAsyncError={displayModalError}
          user={user}
          viewMode={true}
          document={document!}
          contacts={extendedContacts}/>}
      </DocumentForm>
    </Box>
  );

};


export default withRouter(ViewDocument);


