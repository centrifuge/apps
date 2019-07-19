import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import DocumentForm from './DocumentForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { Box, Button, Heading, Paragraph } from 'grommet';
import { documentRoutes } from './routes';
import { LinkPrevious, Money } from 'grommet-icons';
import { canWriteToDoc, User } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { RequestState } from '../store/reducers/http-request-reducer';
import { Document } from '../common/models/document';
import { SecondaryHeader } from '../components/SecondaryHeader';
import {
  getDocumentById,
  mintNFTForDocument,
  resetGetDocumentById,
  resetUpdateDocument,
  updateDocument,
} from '../store/actions/documents';
import { getSchemasList, resetGetSchemasList } from '../store/actions/schemas';
import { Schema } from '../common/models/schema';
import { Contact } from '../common/models/contact';
import { Modal } from '@centrifuge/axis-modal';
import MintNftForm, { MintNftFormData } from './MintNftForm';

type Props = {
  updateDocument: typeof updateDocument;
  resetUpdateDocument: typeof resetUpdateDocument;
  getDocumentById: typeof getDocumentById
  resetGetDocumentById: typeof resetGetDocumentById
  getSchemasList: typeof getSchemasList
  resetGetSchemasList: typeof resetGetSchemasList
  getContacts: typeof getContacts;
  resetGetContacts: typeof getContacts;
  mintNFTForDocument: typeof mintNFTForDocument;
  document?: Document;
  schemas: Schema[];
  contacts?: Contact[];
  loggedInUser: User;
  updatingDocument: RequestState<Document>;
  mintingNFT: RequestState<Document>;
} & RouteComponentProps<{ id?: string }>;

export class EditDocument extends React.Component<Props> {

  state = {
    mintNft: false,
  };

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

  mintNFT = (data: MintNftFormData) => {
    this.closeMintModal();
    const { document, mintNFTForDocument, loggedInUser } = this.props;

    mintNFTForDocument(document!._id || '', {
      deposit_address: data.transfer ? data.deposit_address : loggedInUser.account,
      proof_fields: data.registry!.proofs,
      registry_address: data.registry!.address
    });
  };


  openMintModal = () => {
    this.setState({ mintNft: true });
  };

  closeMintModal = () => {
    this.setState({ mintNft: false });
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    const {
      updatingDocument,
      mintingNFT,
      contacts,
      document,
      schemas,
      loggedInUser,
    } = this.props;

    const { mintNft } = this.state;

    if (!document || !contacts || !schemas) {
      return <Preloader message="Loading"/>;
    }

    if (updatingDocument.loading) {
      return <Preloader message="Updating document" withSound={true}/>;
    }


    if (mintingNFT.loading) {
      return <Preloader message="Minting NFT" withSound={true}/>;
    }

    // TODO add route resolvers and remove this logic
    if (!canWriteToDoc(loggedInUser, document)) {
      return <Paragraph color="status-error"> Access Denied! </Paragraph>;
    }

    const selectedSchema: Schema | undefined = schemas.find(s => {
      return (
        document.attributes &&
        document.attributes._schema &&
        s.name === document.attributes._schema.value
      );
    });

    if (!selectedSchema) return <p>Unsupported schema</p>;

    const mintActions = [
        <Button key="mint_nft" onClick={this.openMintModal} icon={<Money/>} plain label={'Mint NFT'}/>,
      ]
    ;
    return (
      <>
        <Modal
          width={'large'}
          opened={mintNft}
          headingProps={{ level: 3 }}
          title={`Mint NFT`}
          onClose={this.closeMintModal}
        >
          <MintNftForm
            onSubmit={this.mintNFT}
            onDiscard={this.closeMintModal}
            registries={selectedSchema.registries}
          />
        </Modal>

        <DocumentForm
          onSubmit={this.updateDocument}
          selectedSchema={selectedSchema}
          mode={'edit'}
          contacts={contacts}
          document={document}
          schemas={schemas}
          mintActions={mintActions}
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
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
    mintingNFT: state.documents.mintNFT,
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
    mintNFTForDocument,
  },
)(withRouter(EditDocument));
