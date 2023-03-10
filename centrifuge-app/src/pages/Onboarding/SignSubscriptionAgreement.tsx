import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
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
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Sign subscription agreement</Text>
        <Text fontSize={2}>Complete subscription agreement</Text>
        {isAgreementFetched && (
          <Box overflowY="scroll" height="500px">
            <PDFViewer file={(signedAgreementUrl ? signedAgreementUrl : unsignedAgreementData) as string} />
          </Box>
        )}
      </Box>
      <Checkbox
        style={{
          cursor: 'pointer',
        }}
        checked={hasSignedAgreement || isAgreed}
        onChange={() => setIsAgreed((current) => !current)}
        label={<Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>I agree to the agreement</Text>}
        disabled={isSigningTransaction || isSending || hasSignedAgreement}
      />
      <Shelf gap="2">
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
      </Shelf>
    </Stack>
  )
}
