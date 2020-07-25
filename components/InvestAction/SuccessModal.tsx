import * as React from 'react'
import { Paragraph, Box } from 'grommet'

import { FormModal, InvestmentSteps, AcceptButton } from './styles'

interface Props {
  open: boolean
  onClose(): void
}

const InvestActionSuccessModal: React.FunctionComponent<Props> = (props: Props) => {
  return (
    <FormModal
      opened={props.open}
      title={'Congratulations!'}
      headingProps={{ color: 'status-ok' }}
      onClose={props.onClose}
    >
      <InvestmentSteps src="../../static/invest-steps2.svg" alt="Investment steps" />

      <Paragraph margin={{ top: 'medium' }}>
        Your information has been successfully submitted and your onboarding process is initiated. The Issuer will
        shortly reach out to you.
      </Paragraph>

      <Paragraph margin={{ top: 'small' }}>
        Please prepare the following list of documents:
        <br />
        <ul>
          <li>
            Copy of valid passport/driver’s license/ID card of the investor/representative and beneficial owners hulding
            10% or more if a legal entity
          </li>
          <li>Copy of certificate of incorporation or registration if a legal entity</li>
          <li>Copy of Memorandum and Articles of Association if a legal entity</li>
          <li>Copy of Certificate of Incumbency or Trade Register Excerpt if a legal entity</li>
          <li>
            Proof of Address, which are copies of 2 third party issued documents from the last three months stating your
            address as the investor/representative, your legal entity and its beneficial owners if a legal entity (that
            can be any combination of documents like a utility or telephone bill, an official letter from a public
            authority, a bank statement, an insurance policy or something similar)
          </li>
        </ul>
      </Paragraph>

      <Box direction="row" justify="end">
        <Box basis={'1/5'}>
          <AcceptButton primary onClick={props.onClose} label="OK" fill={true} />
        </Box>
      </Box>
    </FormModal>
  )
}

export default InvestActionSuccessModal
