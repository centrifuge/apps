import React from 'react';
import { Box, Button, FormField, TextInput } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FundingAgreement } from '../common/models/funding-request';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { dateToString, extractDate, getCurrencyFormat, getPercentFormat } from '../common/formaters';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { Contact } from '../common/models/contact';
import { ViewModeFormContainer } from '../components/ViewModeFormContainer';
import { getContactByAddress } from '../common/contact-utils';

type Props = {
  onSubmit: (fundingRequest: FundingAgreement) => void;
  onDiscard: () => void;
  contacts: Contact[];
  today: Date;
  isViewMode: boolean;
  fundingAgreement: FundingAgreement;
};
// TODO use function components here
export default class FundingRequestForm extends React.Component<Props> {
  displayName = 'CreateEditInvoice';
  static defaultProps = {
    onSubmit: (fundingAgreement: FundingAgreement) => {
      // do nothing by default
    },
    onDiscard: () => {
      // do nothing by default
    },
    isViewMode: false,
    today: new Date(),
    contacts: [],
  };

  state = { submitted: false };

  onSubmit = (values: FundingAgreement) => {
    return this.props.onSubmit({ ...values });
  };

  onDiscard = () => {
    this.props.onDiscard();
  };


  render() {

    const { submitted } = this.state;
    const { fundingAgreement, contacts, today, isViewMode } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'large';
    const percentParts = getPercentFormat();


    const fundingRequestValidation = Yup.object().shape({
      funder_id: Yup.string()
        .required('This field is required'),
      nft_address: Yup.string()
        .matches(/^0x/, 'must start with 0x')
        .length(66, 'must have 66 characters'),
      repayment_amount: Yup.number()
        .moreThan(0, 'Must be greater than 0')
        .required('This field is required'),
      apr: Yup.number()
        .required('This field is required'),
      fee: Yup.number()
        .required('This field is required'),
      repayment_due_date: Yup.date()
        .typeError('Wrong date format')
        .required('This field is required'),

    });

    return (
      <Box pad={{ top: 'large', bottom: 'large' }}>
        <Formik
          validationSchema={fundingRequestValidation}
          initialValues={fundingAgreement}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          onSubmit={(values, { setSubmitting }) => {
            if (!values) return;
            this.onSubmit(values);
            setSubmitting(true);
          }}
        >
          {
            ({
               values,
               errors,
               handleChange,
               setFieldValue,
               handleSubmit,
               submitForm,
             }) => {

              let days, amount, financeRate, feeAmount, financeFee;
              // convert string to float
              const repaymentAmount = parseFloat(values.repayment_amount);
              const apr = parseFloat(values.apr);

              // Calculate days for loan
              const repaymentDate = new Date(values.repayment_due_date);
              const diff = repaymentDate.getTime() - today.getTime();
              const additionalFee = 0;
              days = Math.round(diff / (1000 * 60 * 60 * 24));

              financeRate = apr / 360 * days;
              feeAmount = additionalFee * repaymentAmount;
              financeFee = parseFloat(((repaymentAmount * financeRate + feeAmount) || 0).toFixed(2));
              amount = repaymentAmount - financeFee;


              if (isNaN(amount)) amount = 0;
              if (isNaN(days)) days = 0;
              values.days = days.toString();
              values.fee = financeFee.toString();
              values.amount = amount.toFixed(2).toString();


              const currencyFormat = getCurrencyFormat(values.currency);

              return (
                <Box direction="column" gap={sectionGap}>
                  <ViewModeFormContainer isViewMode={isViewMode} direction="column" gap={sectionGap}>
                    <Box gap={columnGap}>
                      <Box direction="row" gap={columnGap}>
                        <Box basis='1/2'>
                          <FormField
                            label="Funder"
                            error={errors!.funder_id}
                          >
                            <SearchSelect
                              disabled={isViewMode}
                              labelKey={'name'}
                              valueKey={'address'}
                              options={contacts}
                              value={getContactByAddress(values!.funder_id, contacts)}
                              onChange={(selected) => {
                                setFieldValue('funder_id', selected.address);
                              }}
                            />
                          </FormField>
                        </Box>

                        <Box basis='1/2'>
                          <FormField
                            label="Currency"
                            error={errors!.currency}
                          >

                            <TextInput
                              disabled={isViewMode}
                              name="currency"
                              value={values!.currency}
                              onChange={handleChange}
                            />
                          </FormField>
                        </Box>
                      </Box>
                    </Box>

                    <Box gap={columnGap}>
                      <Box direction="row" gap={columnGap}>
                        <Box basis='1/2'>
                          <FormField
                            label={`Repayment amount`}
                            error={errors!.repayment_amount}
                          >
                            <NumberInput
                              disabled={isViewMode}
                              {...currencyFormat}
                              name="repayment_amount"
                              value={values!.repayment_amount}
                              onChange={({ value }) => {
                                setFieldValue('repayment_amount', value);
                              }}
                            />

                          </FormField>
                        </Box>

                        <Box basis='1/2'>
                          <FormField
                            label="APR"
                            error={errors!.apr}
                          >
                            <NumberInput
                              {...percentParts}
                              disabled={true}
                              name="apr"
                              value={apr * 100}
                            />
                          </FormField>
                        </Box>
                      </Box>
                    </Box>
                    <Box gap={columnGap}>
                      <Box direction="row" gap={columnGap}>
                        <Box basis='1/2'>
                          <FormField
                            label={`Finance fee`}
                            error={errors!.fee}
                          >
                            <NumberInput
                              {...currencyFormat}
                              disabled={true}
                              value={values.fee}
                            />
                          </FormField>
                        </Box>

                        <Box basis='1/2'>
                          <FormField
                            label={`Finance amount`}
                            error={errors!.amount}
                          >
                            <NumberInput
                              {...currencyFormat}
                              name="amount"
                              disabled={true}
                              value={values!.amount}
                            />
                          </FormField>
                        </Box>
                      </Box>
                    </Box>
                    <Box gap={columnGap}>
                      <Box direction="row" gap={columnGap}>
                        <Box basis='1/2'>
                          <FormField
                            label="Funding date"
                          >
                            <DateInput
                              disabled={true}
                              value={extractDate(today)}

                            />
                          </FormField>
                        </Box>

                        <Box basis='1/2'>
                          <FormField
                            label="Repayment due date"
                            error={errors!.repayment_due_date}
                          >
                            <DateInput
                              disabled={isViewMode}
                              name="repayment_due_date"
                              type="date"
                              value={extractDate(values!.repayment_due_date)}
                              onChange={date => {
                                setFieldValue('repayment_due_date', dateToString(date));
                              }}
                            />

                          </FormField>
                        </Box>
                      </Box>
                    </Box>
                    <Box gap={columnGap}>
                      <FormField
                        label="NFT token ID"
                        error={errors!.nft_address}
                      >

                        <TextInput
                          disabled={isViewMode}
                          name="nft_address"
                          value={values!.nft_address}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                  </ViewModeFormContainer>
                  <Box direction="row" justify={'end'} gap="medium" margin={{ top: 'medium' }}>
                    <Button
                      onClick={this.onDiscard}
                      label="Discard"
                    />

                    {!isViewMode && <Button
                      onClick={() => {
                        this.setState({ submitted: true });
                        submitForm();
                      }}
                      primary
                      label="Request"
                    />}
                  </Box>
                </Box>

              );
            }
          }
        </Formik>
      </Box>
    );

  }
}

