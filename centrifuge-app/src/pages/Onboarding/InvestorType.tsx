import { Box, Button, Card, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Dispatch, SetStateAction, useState } from 'react'
import { DataSharingAgreementDialog } from '../../components/DataSharingAgreementDialog'
import { InvestorTypes } from '../../types'

const examplePool = {
  title: 'New Silver Junior Token',
}

type Props = {
  investorType: InvestorTypes | undefined
  isAgreedToDataSharingAgreement: boolean
  nextStep: () => void
  setInvestorType: Dispatch<SetStateAction<InvestorTypes | undefined>>
  setIsAgreedToDataSharingAgreement: Dispatch<SetStateAction<boolean>>
}

export const InvestorType = ({
  investorType,
  isAgreedToDataSharingAgreement,
  nextStep,
  setInvestorType,
  setIsAgreedToDataSharingAgreement,
}: Props) => {
  const [isDataSharingAgreementDialogOpen, setIsDataSharingAgreementDialogOpen] = useState(false)

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Start onboarding to {examplePool.title}</Text>
        <Stack gap={2} py={6}>
          <Card
            width="457px"
            height="60px"
            alignItems="center"
            justifyContent="center"
            display="flex"
            style={{
              cursor: 'pointer',
              backgroundColor: investorType === 'individual' ? '#E0E0E0' : 'white',
            }}
            onClick={() => setInvestorType('individual')}
          >
            <Text variant="heading3">Individual</Text>
          </Card>
          <Card
            width="457px"
            height="60px"
            alignItems="center"
            justifyContent="center"
            display="flex"
            style={{
              cursor: 'pointer',
              backgroundColor: investorType === 'entity' ? '#E0E0E0' : 'white',
            }}
            onClick={() => setInvestorType('entity')}
          >
            <Text variant="heading3">Entity</Text>
          </Card>
        </Stack>
        <Shelf gap={1}>
          <Checkbox
            style={{
              cursor: 'pointer',
            }}
            checked={isAgreedToDataSharingAgreement}
            onChange={() => setIsAgreedToDataSharingAgreement((current) => !current)}
            label={
              <Shelf gap="4px">
                <Text style={{ cursor: 'pointer' }}>I agree to the</Text>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif',
                  }}
                  onClick={() => setIsDataSharingAgreementDialogOpen(true)}
                >
                  <Text variant="body1" color="textInteractive">
                    Data sharing agreement.
                  </Text>
                </button>
              </Shelf>
            }
          />
          <DataSharingAgreementDialog
            isDataSharingAgreementDialogOpen={isDataSharingAgreementDialogOpen}
            setIsDataSharingAgreementDialogOpen={setIsDataSharingAgreementDialogOpen}
          />
        </Shelf>
      </Box>
      <Box>
        <Button variant="primary" onClick={nextStep} disabled={!investorType || !isAgreedToDataSharingAgreement}>
          Next
        </Button>
      </Box>
    </Stack>
  )
}
