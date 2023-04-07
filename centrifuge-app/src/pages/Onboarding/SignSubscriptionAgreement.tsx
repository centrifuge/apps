import { Box, Button, Checkbox, Shelf, Spinner, Text } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, object } from 'yup'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { OnboardingPool, useOnboarding } from '../../components/OnboardingProvider'
import { PDFViewer } from '../../components/PDFViewer'
import { OnboardingUser } from '../../types'
import { useSignAndSendDocuments } from './queries/useSignAndSendDocuments'
import { useSignRemark } from './queries/useSignRemark'
import { useUnsignedAgreement } from './queries/useUnsignedAgreement'

type Props = {
  signedAgreementUrl: string | undefined
  isSignedAgreementFetched: boolean
}

const validationSchema = object({
  isAgreed: boolean().oneOf([true], 'You must agree to the agreement'),
})

export const SignSubscriptionAgreement = ({ signedAgreementUrl, isSignedAgreementFetched }: Props) => {
  const { onboardingUser, pool, previousStep, nextStep } = useOnboarding<
    NonNullable<OnboardingUser>,
    NonNullable<OnboardingPool>
  >()
  const poolId = pool.id
  const trancheId = pool.trancheId

  const hasSignedAgreement = !!onboardingUser.poolSteps?.[poolId]?.[trancheId].signAgreement.completed

  const formik = useFormik({
    initialValues: {
      isAgreed: hasSignedAgreement,
    },
    validationSchema,
    onSubmit: () => {
      signRemark([])
    },
  })

  const { mutate: sendDocumentsToIssuer, isLoading: isSending } = useSignAndSendDocuments()
  const { execute: signRemark, isLoading: isSigningTransaction } = useSignRemark(sendDocumentsToIssuer)
  const { data: unsignedAgreementData, isFetched: isUnsignedAgreementFetched } = useUnsignedAgreement()

  React.useEffect(() => {
    if (hasSignedAgreement) {
      formik.setFieldValue('isAgreed', true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSignedAgreement])

  const isAgreementFetched = React.useMemo(
    () => isUnsignedAgreementFetched || isSignedAgreementFetched,
    [isSignedAgreementFetched, isUnsignedAgreementFetched]
  )

  return (
    <>
      <Content>
        <ContentHeader title="Sign subscription agreement" body="Complete subscription agreement" />

        <Box
          position="relative"
          overflowY="auto"
          minHeight="30vh"
          maxHeight="500px"
          borderWidth={isAgreementFetched ? 1 : 0}
          borderColor="borderPrimary"
          borderStyle="solid"
          borderRadius="tooltip"
        >
          {isAgreementFetched ? (
            <PDFViewer file={(signedAgreementUrl ? signedAgreementUrl : unsignedAgreementData) as string} />
          ) : (
            <Shelf
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="iconLarge" />
            </Shelf>
          )}
        </Box>

        <Checkbox
          {...formik.getFieldProps('isAgreed')}
          checked={formik.values.isAgreed}
          label={
            <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>
              I hereby agree to the terms of the subscription agreement
            </Text>
          }
          disabled={isSigningTransaction || isSending || hasSignedAgreement}
          errorMessage={formik.errors.isAgreed}
        />
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary" disabled={isSigningTransaction || isSending}>
          Back
        </Button>
        <Button
          onClick={hasSignedAgreement ? () => nextStep() : () => formik.handleSubmit()}
          loadingMessage="Signing"
          loading={isSigningTransaction || isSending}
          disabled={isSigningTransaction || isSending}
        >
          {hasSignedAgreement ? 'Next' : 'Sign'}
        </Button>
      </ActionBar>
    </>
  )
}
