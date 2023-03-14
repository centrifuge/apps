import { Box, Button, Checkbox, Shelf, Spinner, Text } from '@centrifuge/fabric'
import * as React from 'react'
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

export const SignSubscriptionAgreement = ({ signedAgreementUrl, isSignedAgreementFetched }: Props) => {
  const [isAgreed, setIsAgreed] = React.useState(false)
  const { onboardingUser, pool, previousStep, nextStep } = useOnboarding<
    NonNullable<OnboardingUser>,
    NonNullable<OnboardingPool>
  >()

  const poolId = pool.id
  const trancheId = pool.trancheId

  const hasSignedAgreement = !!onboardingUser.poolSteps[poolId][trancheId].signAgreement.completed

  const { mutate: sendDocumentsToIssuer, isLoading: isSending } = useSignAndSendDocuments()
  const { execute: signRemark, isLoading: isSigningTransaction } = useSignRemark(sendDocumentsToIssuer)
  const { data: unsignedAgreementData, isFetched: isUnsignedAgreementFetched } = useUnsignedAgreement()

  React.useEffect(() => {
    if (hasSignedAgreement) {
      setIsAgreed(true)
    }
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
          checked={hasSignedAgreement || isAgreed}
          onChange={() => setIsAgreed((current) => !current)}
          label={
            <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>
              I hereby agree to the terms of the subscription agreement
            </Text>
          }
          disabled={isSigningTransaction || isSending || hasSignedAgreement}
        />
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} variant="secondary" disabled={isSigningTransaction || isSending}>
          Back
        </Button>
        <Button
          onClick={hasSignedAgreement ? () => nextStep() : () => signRemark([])}
          loadingMessage="Signing"
          loading={isSigningTransaction || isSending}
          disabled={!isAgreed || isSigningTransaction || isSending}
        >
          {hasSignedAgreement ? 'Next' : 'Sign'}
        </Button>
      </ActionBar>
    </>
  )
}
