import { Box, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Dispatch, SetStateAction, useState } from 'react'
import { InvestorTypes } from '../../types'
import { DataSharingAgreementDialog } from './DataSharingAgreementDialog'

const examplePool = {
  title: 'New Silver Junior Token',
}

type Props = {
  investorType: InvestorTypes | undefined
  isAgreedToDataSharingAgreement: boolean
  setInvestorType: Dispatch<SetStateAction<InvestorTypes | undefined>>
  setIsAgreedToDataSharingAgreement: Dispatch<SetStateAction<boolean>>
}

export const InvestorType = ({
  investorType,
  isAgreedToDataSharingAgreement,
  setInvestorType,
  setIsAgreedToDataSharingAgreement,
}: Props) => {
  const [isDataSharingAgreementDialogOpen, setIsDataSharingAgreementDialogOpen] = useState(false)

  return (
    <Box>
      <Text fontSize={5}>Start onboarding to {examplePool.title}</Text>
      <Stack gap={2} py={6}>
        <button
          style={{
            background: 'none',
            width: '457px',
            height: '60px',
            border: '1px solid #E0E0E0',
            borderRadius: '11px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: investorType === 'individual' ? '#E0E0E0' : 'white',
          }}
          onClick={() => setInvestorType('individual')}
        >
          <Text variant="heading3">Individual</Text>
        </button>
        <button
          style={{
            background: 'none',
            width: '457px',
            height: '60px',
            border: '1px solid #E0E0E0',
            borderRadius: '11px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: investorType === 'entity' ? '#E0E0E0' : 'white',
          }}
          onClick={() => setInvestorType('entity')}
        >
          <Text variant="heading3">Entity</Text>
        </button>
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
  )
}
