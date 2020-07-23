import * as React from 'react'
import styled from 'styled-components'
import { Box, Button, Paragraph, CheckBox, RadioButton, Form, FormField, TextInput, Select } from 'grommet'
import { Modal } from '@centrifuge/axis-modal'

import { countryList } from './countries'
import { isValidEmail } from '../../utils/email'

const InvestmentSteps = styled.img`
  display: block;
  max-width: 600px;
  margin: 20px auto;
`

const FormFieldWithoutBorder = styled(FormField)`
  > div {
    border-bottom-color: rgba(0, 0, 0, 0);
  }
`

interface Props {}

interface FormSubmission {
  title: 'Mr.' | 'Ms.' | undefined
  givenName: string
  surname: string
  email: string
  countryOfResidence: string | undefined
  investorType: string | undefined
  investmentSize: string | undefined
  investorConfirmation: boolean
}

const initialForm: FormSubmission = {
  title: undefined,
  givenName: '',
  surname: '',
  email: '',
  countryOfResidence: undefined,
  investorType: undefined,
  investmentSize: undefined,
  investorConfirmation: false,
}

type FormErrors = { [K in keyof FormSubmission]?: string }

const InvestAction: React.FunctionComponent<Props> = () => {
  const [filteredCountries, setFilteredCountries] = React.useState<string[]>(countryList)
  const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false)

  const [form, setForm] = React.useState<FormSubmission>(initialForm)
  const [errors, setErrors] = React.useState<FormErrors>({})

  const handleOnChange = (fieldName: keyof FormSubmission) => {
    return (event: React.FormEvent<HTMLInputElement>) => {
      setForm({ ...form, [fieldName]: event.currentTarget.value })
    }
  }

  const handleOnChangeSelect = (fieldName: keyof FormSubmission) => {
    return (event: { option: any }) => {
      setForm({ ...form, [fieldName]: event.option })
    }
  }

  const onSearchCountries = (searchQuery: string) => {
    if (searchQuery.trim().length === 0) setFilteredCountries(countryList)

    setFilteredCountries(
      countryList.filter((country: string) => country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const onOpen = () => {
    setModalIsOpen(true)
  }

  const onClose = () => {
    setModalIsOpen(false)
  }

  const onSubmit = () => {
    // Check if all of the fields are set
    const newErrors: FormErrors = {}
    ;(Object.keys(form) as (keyof FormSubmission)[]).map((fieldName: keyof FormSubmission) => {
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
  }

  return (
    <Box>
      <Button primary label="Invest" margin={{ left: 'auto', vertical: 'large' }} onClick={onOpen} />

      <Modal opened={modalIsOpen} title={'Interested in investing?'} onClose={onClose}>
        <Form onSubmit={onSubmit}>
          <InvestmentSteps src="../../static/invest-steps1.png" alt="Investment steps" />
          <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
            To invest in this pool please provide your information to go through KYC. Submit your information below to
            start the KYC and onboarding process. The Issuer will shortly reach out to you.
          </Paragraph>

          <Box direction="row" margin={{ bottom: 'medium' }} gap={'medium'}>
            <Box>
              <RadioButton
                name="radio"
                checked={form.title === 'Mr.'}
                label="Mr."
                onChange={(event: any) => setForm({ ...form, title: event.target.checked ? 'Mr.' : 'Ms.' })}
              />
            </Box>
            <Box>
              <RadioButton
                name="radio"
                checked={form.title === 'Ms.'}
                label="Ms."
                onChange={(event: any) => setForm({ ...form, title: event.target.checked ? 'Ms.' : 'Mr.' })}
              />
            </Box>
          </Box>

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
                  options={['<25,000 USD', '25,000-50,000 USD', '>50,000 USD']}
                  value={form.investmentSize}
                  onChange={handleOnChangeSelect('investmentSize')}
                />
              </FormField>
            </Box>
          </Box>

          <FormFieldWithoutBorder error={errors.investorConfirmation}>
            <Box direction="row" margin={{ top: 'small' }}>
              <Box style={{ minWidth: '40px', paddingTop: '20px' }}>
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

          <Box direction="row" justify="end">
            <Box basis={'1/5'}>
              <Button primary onClick={onSubmit} label="Submit" fill={true} />
            </Box>
          </Box>
        </Form>
      </Modal>
    </Box>
  )
}

export default InvestAction
