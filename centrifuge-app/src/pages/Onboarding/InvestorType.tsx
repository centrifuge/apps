import { Box, Checkbox, Text } from '@centrifuge/fabric'
import { Dispatch, SetStateAction } from 'react'
import { InvestorTypes } from '../../types'

const examplePool = {
  title: 'New Silver Junior Token',
}

type Props = {
  setInvestorType: Dispatch<SetStateAction<InvestorTypes | undefined>>
}

export const InvestorType = ({ setInvestorType }: Props) => (
  <Box>
    <Text fontSize={5}>Start onboarding to {examplePool.title}</Text>
    <Box display="grid" gridRowGap={2} gridTemplateRows="min-content min-content" py={6}>
      <button
        style={{
          all: 'unset',
          width: '457px',
          height: '60px',
          border: '1px solid #E0E0E0',
          borderRadius: '11px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={() => setInvestorType('individual')}
      >
        <Text variant="heading3">Individual</Text>
      </button>
      <button
        style={{
          all: 'unset',
          width: '457px',
          height: '60px',
          border: '1px solid #E0E0E0',
          borderRadius: '11px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={() => setInvestorType('entity')}
      >
        <Text variant="heading3">Entity</Text>
      </button>
    </Box>
    <Box display="flex" alignItems="center" gridColumnGap={1}>
      <Checkbox />
      <Text>
        I agree to the{' '}
        <a href="https://www.google.com" target="_blank" rel="noreferrer">
          Datasharing agreement
        </a>
        .
      </Text>
    </Box>
  </Box>
)
