import * as React from 'react'
import styled from 'styled-components'
import { Box, Button, Paragraph, CheckBox, RadioButton, Form, FormField, TextInput, Select } from 'grommet'

import { countryList } from './countries'
import { isValidEmail } from '../../utils/email'
import InvestActionSuccessModal from './SuccessModal'
import { FormModal, InvestmentSteps, FormFieldWithoutBorder, AcceptButton, ErrorMessage } from './styles'

const LAMBDA_SEND_INVESTOR_EMAIL_URL = '/.netlify/functions/sendInvestorEmail'

// Fixes the radio button alignment in firefox
const StyledRadioButton = styled(RadioButton)`
  display: none;
`

interface Props {
  poolName: string
}

interface FormData {
  title: 'Mr.' | 'Ms.' | undefined
  givenName: string
  surname: string
  email: string
  countryOfResidence: string | undefined
  investorType: string | undefined
  investmentSize: string | undefined
  investorConfirmation: boolean
}

export interface FormSubmission extends FormData, Props {}

const initialForm: FormData = {
  title: undefined,
  givenName: '',
  surname: '',
  email: '',
  countryOfResidence: undefined,
  investorType: undefined,
  investmentSize: undefined,
  investorConfirmation: false,
}

type FormErrors = { [K in keyof FormData]?: string }

const submitForm = async (form: FormData) => {
  return await fetch(LAMBDA_SEND_INVESTOR_EMAIL_URL, {
    method: 'POST',
    body: JSON.stringify(form),
  })
}

const InvestAction: React.FunctionComponent<Props> = (props: Props) => {
  const [filteredCountries, setFilteredCountries] = React.useState<string[]>(countryList)
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false)
  const [successModalIsOpen, setSuccessModalIsOpen] = React.useState<boolean>(false)
  const [failedSubmission, setFailedSubmission] = React.useState<boolean>(false)

  const [form, setForm] = React.useState<FormData>(initialForm)
  const [errors, setErrors] = React.useState<FormErrors>({})

  const handleOnChange = (fieldName: keyof FormData) => {
    return (event: React.FormEvent<HTMLInputElement>) => {
      setForm({ ...form, [fieldName]: event.currentTarget.value })
    }
  }

  const handleOnChangeSelect = (fieldName: keyof FormData) => {
    return (event: { option: any }) => {
      setForm({ ...form, [fieldName]: event.option })
    }
  }

  const onSearchCountries = (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      setFilteredCountries(countryList)
    } else {
      setFilteredCountries(
        countryList.filter((country: string) => country.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      )
    }
  }

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const onSubmit = async () => {
    // Check if all of the fields are set
    const newErrors: FormErrors = {}
    ;(Object.keys(form) as (keyof FormData)[]).map((fieldName: keyof FormData) => {
      if (form[fieldName] === undefined || (form[fieldName] as string).length === 0) {
        newErrors[fieldName] = 'This is required'
      }
    })

    // Check for a valid email address
    if (!newErrors['email'] && !isValidEmail(form.email)) {
      newErrors['email'] = 'Please insert a valid email address'
    }

    // Check that the investor confirmation is checked
    if (!form['investorConfirmation'] || (form['investorConfirmation'] && form['investorConfirmation'] !== true)) {
      newErrors['investorConfirmation'] = 'This needs to be checked'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      const response = await submitForm({ ...form, ...props } as FormSubmission)

      if (response.ok) {
        onClose()
        setSuccessModalIsOpen(true)
      } else {
        console.error('Failed to submit investor interest form', response.statusText)
        setFailedSubmission(true)
      }
    }
  }

  return (
    <Box>
      <Button primary label="Learn more" margin={{ left: 'auto', vertical: 'large' }} onClick={onOpen} />

      <FormModal opened={modalIsOpen} title={'Interested in investing?'} onClose={onClose}>
        <Form onSubmit={onSubmit}>
          <InvestmentSteps src="../../static/invest-steps1.svg" alt="Investment steps" />

          <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
            If you want to learn more please leave your contact details and investor profile to start on-boarding.
            Please note that this is for non-US investors and accredited US investors only.
          </Paragraph>

          <FormFieldWithoutBorder error={errors.title} margin={{ bottom: 'medium' }}>
            <Box direction="row" gap={'medium'}>
              <Box>
                <StyledRadioButton
                  name="radio"
                  checked={form.title === 'Mr.'}
                  label="Mr."
                  onChange={(event: any) => setForm({ ...form, title: event.target.checked ? 'Mr.' : 'Ms.' })}
                />
              </Box>
              <Box>
                <StyledRadioButton
                  name="radio"
                  checked={form.title === 'Ms.'}
                  label="Ms."
                  onChange={(event: any) => setForm({ ...form, title: event.target.checked ? 'Ms.' : 'Mr.' })}
                />
              </Box>
            </Box>
          </FormFieldWithoutBorder>

          <Box direction="row" gap={'medium'}>
            <Box basis={'1/2'}>
              <FormField label="Given Name" margin={{ bottom: 'medium' }} error={errors.givenName}>
                <TextInput value={form.givenName} onChange={handleOnChange('givenName')} />
              </FormField>
            </Box>
            <Box basis={'1/2'}>
              <FormField label="Surname" margin={{ bottom: 'medium' }} error={errors.surname}>
                <TextInput value={form.surname} onChange={handleOnChange('surname')} />
              </FormField>
            </Box>
          </Box>
          <Box direction="row" gap={'medium'}>
            <Box basis={'1/2'}>
              <FormField label="Email" margin={{ bottom: 'medium' }} error={errors.email}>
                <TextInput type="email" value={form.email} onChange={handleOnChange('email')} />
              </FormField>
            </Box>
            <Box basis={'1/2'}>
              <FormField label="Country of Residence" margin={{ bottom: 'medium' }} error={errors.countryOfResidence}>
                <Select
                  placeholder="Select Country"
                  options={filteredCountries}
                  value={form.countryOfResidence}
                  onChange={handleOnChangeSelect('countryOfResidence')}
                  onSearch={onSearchCountries}
                />
              </FormField>
            </Box>
          </Box>
          <Box direction="row" gap={'medium'}>
            <Box basis={'1/2'}>
              <FormField label="Type of Investor" error={errors.investorType}>
                <Select
                  placeholder="Select Investor Type"
                  options={['Individual', 'Representing a legal entity']}
                  value={form.investorType}
                  onChange={handleOnChangeSelect('investorType')}
                />
              </FormField>
            </Box>
            <Box basis={'1/2'}>
              <FormField label="Estimated Size of Investment, USD" error={errors.investmentSize}>
                <Select
                  placeholder="Select Investment Size"
                  options={['<10,000 USD', '10,000-24,999 USD', '25,000-50,000 USD', '>50,000 USD']}
                  value={form.investmentSize}
                  onChange={handleOnChangeSelect('investmentSize')}
                />
              </FormField>
            </Box>
          </Box>

          <FormFieldWithoutBorder error={errors.investorConfirmation}>
            <Box direction="row" margin={{ top: 'small' }}>
              <Box style={{ minWidth: '40px', paddingTop: '20px', paddingLeft: '4px' }}>
                <CheckBox
                  name="check"
                  checked={form.investorConfirmation}
                  onChange={(event: any) => setForm({ ...form, investorConfirmation: event.target.checked })}
                />
              </Box>
              <Box flex={'grow'}>
                <Paragraph>
                  I hereby confirm that I’m or I’m representing either:
                  <br />
                  A non-US investor not located in a jurisdiction restricting the purchase and holding of crypto assets
                  <br />
                  or
                  <br />A US accredited investor, and I’m able to prove my accredited investor status to the Issuer.
                </Paragraph>
              </Box>
            </Box>
          </FormFieldWithoutBorder>

          <Paragraph margin={{ top: 'small', bottom: 'small' }}>
            Any questions left? Feel free to reach out to the Issuer directly (see{' '}
            <a href="#" onClick={onClose}>
              Pool Overview
            </a>
            ).
          </Paragraph>

          {failedSubmission && (
            <ErrorMessage type="error">
              Failed to submit investor interest form. Please try again or reach out to us:{' '}
              <a href="mailto:ask@centrifuge.io" target="_blank">
                ask@centrifuge.io
              </a>
            </ErrorMessage>
          )}

          <Box direction="row" justify="end">
            <Box basis={'1/5'}>
              <AcceptButton primary onClick={onSubmit} label="Submit" fill={true} />
            </Box>
          </Box>
        </Form>
      </FormModal>

      <InvestActionSuccessModal open={successModalIsOpen} onClose={() => setSuccessModalIsOpen(false)} />
    </Box>
  )
}

export default InvestAction
