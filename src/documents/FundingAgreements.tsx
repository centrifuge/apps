import React, { FunctionComponent } from 'react';
import { useMergeState } from '../hooks';
import { httpClient } from '../http-client';
import { Contact } from '../common/models/contact';
import FundingRequestForm from './FundingAgreementForm';
import { Modal } from '@centrifuge/axis-modal';
import { Document } from '../common/models/document';
import { getAddressLink } from '../common/etherscan';
import { extractDate, formatCurrency } from '../common/formaters';
import { Section } from '../components/Section';
import { Anchor, Box, Button, DataTable, Paragraph } from 'grommet';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Currency } from 'grommet-icons';
import { canSignFunding, User } from '../common/models/user';
import { FundingStatus } from './FundingStatus';
import { getFundingStatus } from '../common/status';
import { FundingAgreement, FundingRequest } from '../common/models/funding-request';
import { getContactByAddress } from '../common/contact-utils';

type Props = {
  onAsyncStart?: (message: string) => void;
  onAsyncComplete?: (data) => void;
  onAsyncError?: (error, title?: string) => void;
  document: Document,
  contacts: Contact[],
  user: User | null,
  viewMode: boolean,
}

type State = {
  modalOpened: boolean,
  selectedFundingAgreement: FundingAgreement,
  isViewMode: boolean,
}

export const FundingAgreements: FunctionComponent<Props> = (props) => {

  const [{
    modalOpened,
    selectedFundingAgreement,
    isViewMode,
  }, setState] = useMergeState<State>({
    modalOpened: false,
    selectedFundingAgreement: new FundingAgreement(),
    isViewMode: false,
  });


  const {
    onAsyncStart,
    onAsyncComplete,
    onAsyncError,
    document,
    user,
    contacts,
    viewMode,
  } =
    {
      onAsyncStart: (message: string) => {
      },
      onAsyncComplete: (data) => {
      },
      onAsyncError: (error, title?: string) => {
      },

      ...props,
    };


  const createFundingAgreement = async (data: FundingAgreement) => {
    setState({
      modalOpened: false,
    });

    onAsyncStart('Creating Funding Agreement');
    try {
      const payload = {
        ...data,
        document_id: document!.header!.document_id!,
      } as FundingRequest;
      onAsyncComplete((await httpClient.funding.create(payload)).data);

    } catch (e) {
      onAsyncError(e, 'Failed to create funding agreement');
    }
  };

  const singFundingAgreement = async (funding: FundingAgreement) => {


    onAsyncStart('Signing Funding Agreement');
    try {
      const payload = {
        agreement_id: funding.agreement_id,
        document_id: document!.header!.document_id!,
      };
      onAsyncComplete((await httpClient.funding.sign(payload)).data);

    } catch (e) {
      onAsyncError(e, 'Failed to sign funding agreement');
    }
  };

  const openModalInEditMode = (fundingAgreement: FundingAgreement) => {
    setState({
      selectedFundingAgreement: fundingAgreement,
      isViewMode: false,
      modalOpened: true,
    });
  };

  const openModalInViewMode = (fundingAgreement: FundingAgreement) => {
    setState({
      selectedFundingAgreement: fundingAgreement,
      isViewMode: true,
      modalOpened: true,
    });
  };

  const closeModal = () => {
    setState({ modalOpened: false });
  };


  const fundingActions = !viewMode ? [
    <Button key="create-funding-agreement" onClick={() => openModalInEditMode(new FundingAgreement())}
            icon={<Currency/>} plain label={'Request funding'}/>,
  ] : [];


  const agreements = document!.attributes!.funding_agreement || [];

  const mappedToSortable = agreements.map((fundingAgreement, index) => {
    return {
      agreement_id: fundingAgreement.agreement_id.value,
      amount: fundingAgreement.amount.value,
      currency: fundingAgreement.currency.value,
      repayment_amount: fundingAgreement.repayment_amount.value,
      repayment_due_date: fundingAgreement.repayment_due_date.value,
      funder_id: fundingAgreement.funder_id.value,
      status: getFundingStatus(fundingAgreement),
      fee: fundingAgreement.fee.value,
      nft_address: fundingAgreement.nft_address ? fundingAgreement.nft_address.value : '',
      days: fundingAgreement.days.value,
      apr: fundingAgreement.apr.value,
    } as FundingAgreement;
  });

  const columns = [
    {
      property: 'agreement_id',
      header: 'Agreement Id',
      render: datum => <DisplayField
        copy={true}
        as={'span'}
        value={datum.agreement_id}/>,

    },
    {
      property: 'funder_id',
      header: 'Funder',
      render: datum => <DisplayField
        copy={true}
        as={'span'}
        link={{
          href: getAddressLink(datum.funder_id),
          target: '_blank',
        }}
        value={getContactByAddress(datum.funder_id, contacts).name}/>,
    },
    {
      property: 'amount',
      header: 'Finance amount',
      render: datum => {
        return formatCurrency(datum.amount, datum.currency);
      },
    },
    {
      property: 'repayment_amount',
      header: 'Repayment amount',
      render: datum => {
        return formatCurrency(datum.repayment_amount, datum.currency);
      },
    },
    {
      property: 'repayment_due_date',
      header: 'Repayment due date',
      render: (datum => extractDate(datum.repayment_due_date)),
    },

    {
      property: 'fee',
      header: 'Finance fee',
      render: datum => {
        return formatCurrency(datum.fee, datum.currency);
      },
    },

    {
      property: 'status',
      header: 'Status',
      render: (datum => <FundingStatus value={datum.status}/>),
    },
    {
      property: '_id',
      header: 'Actions',
      sortable: false,
      render: datum => (
        <Box direction="row" gap="small">
          {canSignFunding(user, document) && <Anchor
            label={'Sign'}
            onClick={() =>
              singFundingAgreement(datum)
            }
          />
          }
          <Anchor
            label={'View'}
            onClick={() =>
              openModalInViewMode(datum)
            }
          />

        </Box>
      ),
    },
  ];


  return <>
    <Modal
      width={'large'}
      opened={modalOpened}
      headingProps={{ level: 3 }}
      title={isViewMode ? `Funding Agreement` : `Request Funding`}
      onClose={closeModal}
    >
      <FundingRequestForm
        fundingAgreement={selectedFundingAgreement}
        isViewMode={isViewMode}
        today={new Date()}
        onSubmit={(data) => {
          createFundingAgreement(data);
        }}
        contacts={contacts}
        onDiscard={closeModal}
      />
    </Modal>

    <Section
      title="Funding Agreements"
      actions={fundingActions}
    >

      <DataTable
        size={'100%'}
        sortable={true}
        data={mappedToSortable}
        primaryKey={'token_id'}
        columns={columns}
      />

      {!mappedToSortable.length &&
      <Paragraph color={'dark-2'}>There are no funding agreements yet.</Paragraph>}
    </Section>

  </>;
};

