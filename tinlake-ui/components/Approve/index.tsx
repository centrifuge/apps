import { Spinner } from '@centrifuge/axis-spinner'
import BN from 'bn.js'
import { Box, Button, Heading, Text } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../ducks/auth'
import Alert from '../Alert'
import { BackLink } from '../BackLink'
import SecondaryHeader from '../SecondaryHeader'

interface Props {
  tinlake: any
  ensureAuthed?: () => Promise<void>
}

interface State {
  is: 'loading' | 'success' | 'error' | null
  errorMsg: string
}

const SUCCESS_STATUS = '0x1'

class Approve extends React.Component<Props, State> {
  state: State = {
    is: null,
    errorMsg: '',
  }

  approve = async () => {
    const { tinlake, ensureAuthed } = this.props
    const addresses = tinlake.contractAddresses

    this.setState({ is: 'loading' })

    try {
      await ensureAuthed!()

      const amount = new BN(-1).toString()
      const approveCurrencyResult = await tinlake.approveCurrency(addresses['LENDER'], amount)

      if (
        approveCurrencyResult.status !== SUCCESS_STATUS ||
        approveCurrencyResult.events[0].event.name !== 'Approval'
      ) {
        this.setState({ is: 'error', errorMsg: JSON.stringify(approveCurrencyResult) })
        return
      }

      const approveCollateralResult = await tinlake.approveCollateral(addresses['LENDER'], amount)

      if (
        approveCollateralResult.status !== SUCCESS_STATUS ||
        approveCollateralResult.events[0].event.name !== 'Approval'
      ) {
        this.setState({ is: 'error', errorMsg: JSON.stringify(approveCollateralResult) })
        return
      }

      this.setState({ is: 'success' })
    } catch (e) {
      console.error(e)
      this.setState({ is: 'error', errorMsg: (e as Error).message })
    }
  }

  render() {
    const { is, errorMsg } = this.state

    return (
      <Box>
        <SecondaryHeader>
          <Box direction="row" gap="small" align="center">
            <BackLink href="/assets" />
            <Heading level="3">Approve</Heading>
          </Box>

          <Button primary onClick={this.approve} label="Approve" disabled={is === 'loading' || is === 'success'} />
        </SecondaryHeader>

        {is === 'loading' ? (
          <Spinner
            height={'calc(100vh - 89px - 84px)'}
            message={'Please approve both transactions. The approval might take a few seconds...'}
          />
        ) : (
          <Box pad={{ horizontal: 'medium' }}>
            {is === 'success' && (
              <Alert type="success">
                Successfully approved
                <br />
              </Alert>
            )}
            {is === 'error' && (
              <Alert type="error">
                <Text weight="bold">Error approving </Text>
                {errorMsg && (
                  <div>
                    <br />
                    {errorMsg}
                  </div>
                )}
              </Alert>
            )}
          </Box>
        )}
        <Alert type="info" margin={{ vertical: 'medium' }}>
          This is a temporary page for backers to enable lenders to take currency and collateral. Backers need to sign
          two transactions:
          <br />
          First transaction: Backer allows lender to take currency
          <br />
          Second transaction: Backer allows lender to take collateral
        </Alert>
      </Box>
    )
  }
}

export default connect((state) => state, { ensureAuthed })(Approve)
