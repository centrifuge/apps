import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useOnboarding } from '../../components/OnboardingProvider'
import { PDFViewer } from '../../components/PDFViewer'
import { useSignAndSendDocuments } from './queries/useSignAndSendDocuments'
import { useSignRemark } from './queries/useSignRemark'
import { useUnsignedAgreement } from './queries/useUnsignedAgreement'

type Props = {
  signedAgreementUrl: string | undefined
  isSignedAgreementFetched: boolean
}

export const SignSubscriptionAgreement = ({ signedAgreementUrl, isSignedAgreementFetched }: Props) => {
  const [isAgreed, setIsAgreed] = React.useState(false)
  const { onboardingUser, pool, previousStep, nextStep } = useOnboarding()

  const { mutate: sendDocumentsToIssuer, isLoading: isSending } = useSignAndSendDocuments()
  const { execute: signRemark, isLoading: isSigningTransaction } = useSignRemark(sendDocumentsToIssuer)
  const { data: unsignedAgreementData, isFetched: isUnsignedAgreementFetched } = useUnsignedAgreement()

  const isCompleted =
    onboardingUser.steps.signAgreements[pool.id][pool.trancheId].signedDocument &&
    !!onboardingUser.steps.signAgreements[pool.id][pool.trancheId].transactionInfo.extrinsicHash

  React.useEffect(() => {
    if (isCompleted) {
      setIsAgreed(true)
    }
  }, [isCompleted])

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
        checked={isCompleted || isAgreed}
        onChange={() => setIsAgreed((current) => !current)}
        label={<Text style={{ cursor: 'pointer' }}>I agree to the agreement</Text>}
        disabled={isSigningTransaction || isSending || isCompleted}
      />
      <Shelf gap="2">
        <Button onClick={() => previousStep()} variant="secondary" disabled={isSigningTransaction || isSending}>
          Back
        </Button>
        <Button
          onClick={isCompleted ? () => nextStep() : () => signRemark([])}
          loadingMessage="Signing"
          loading={isSigningTransaction || isSending}
          disabled={!isAgreed || isSigningTransaction || isSending}
        >
          {isCompleted ? 'Next' : 'Sign'}
        </Button>
      </Shelf>
    </Stack>
  )
}
