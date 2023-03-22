import { Button, Grid, Text } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import { Dispatch, SetStateAction } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { ValidationToast } from '../../components/ValidationToast'
import { InvestorTypes } from '../../types'

type Props = {
  investorType: InvestorTypes | undefined
  setInvestorType: Dispatch<SetStateAction<InvestorTypes | undefined>>
}

const validationSchema = object({
  investorType: string().required('Please choose an investor type'),
})

const CustomButton = styled(Text)<{ selected: boolean }>`
  appearance: none;
  padding: 1.1em 2em;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  text-align: center;
  background-color: ${({ theme, selected }) =>
    selected ? theme.colors.borderPrimary : theme.colors.backgroundPrimary};
  border: ${({ theme }) => `1px solid ${theme.colors.borderPrimary}`};
  border-radius: ${({ theme }) => theme.radii.card}px;
  box-shadow: none;
  transition: background-color 150ms linear;

  &:active,
  &:hover {
    background-color: ${({ theme, disabled }) => (disabled ? 'none' : theme.colors.borderPrimary)};
  }
`

export const InvestorType = ({ investorType, setInvestorType }: Props) => {
  const { onboardingUser, previousStep, nextStep, pool } = useOnboarding()

  const formik = useFormik({
    initialValues: {
      investorType,
    },
    validationSchema,
    onSubmit: () => {
      nextStep()
    },
  })

  const isDisabled = onboardingUser?.investorType ? true : false

  return (
    <>
      {formik.errors.investorType && <ValidationToast label={formik.errors.investorType} />}
      <Content>
        <ContentHeader
          title={`Start onboarding to ${pool ? pool.name : 'Centrifuge'}`}
          body="If you are a U.S. investor, it is only possible to onboard when you are an accredited investor."
        />
        <Grid columns={2} equalColumns gap={2}>
          <CustomButton
            forwardedAs="button"
            variant="heading3"
            onClick={() => {
              formik.setFieldValue('investorType', 'individual')
              setInvestorType('individual')
            }}
            selected={investorType === 'individual'}
            disabled={isDisabled}
          >
            Individual
          </CustomButton>

          <CustomButton
            forwardedAs="button"
            variant="heading3"
            onClick={() => {
              formik.setFieldValue('investorType', 'entity')
              setInvestorType('entity')
            }}
            selected={investorType === 'entity'}
            disabled={isDisabled}
          >
            Entity
          </CustomButton>
        </Grid>
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary">
          Back
        </Button>
        <Button onClick={() => formik.handleSubmit()}>Next</Button>
      </ActionBar>
    </>
  )
}
