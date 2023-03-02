import { Box, Button, Checkbox, Shelf, Spinner, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
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

  const isCompleted = onboardingUser?.poolSteps[pool.id][pool.trancheId].signAgreement.completed

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
    <>
      <Content>
        <ContentHeader title="Sign subscription agreement" body="Complete subscription agreement" />

        {isAgreementFetched ? (
          <Box overflowY="auto" minHeight="55vh" maxHeight="500px">
            <PDFViewer file={(signedAgreementUrl ? signedAgreementUrl : unsignedAgreementData) as string} />
          </Box>
        ) : (
          <Shelf alignItems="center" minHeight="55vh" maxHeight="500px" width="100%">
            <Spinner size="iconLarge" />
          </Shelf>
        )}

        <Checkbox
          checked={isCompleted || isAgreed}
          onChange={() => setIsAgreed((current) => !current)}
          label={<Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>I agree to the agreement</Text>}
          disabled={isSigningTransaction || isSending || isCompleted}
        />
      </Content>

      <ActionBar>
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
      </ActionBar>
    </>
  )
}
