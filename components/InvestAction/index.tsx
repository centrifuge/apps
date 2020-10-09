import * as React from 'react'
import { Box, Button, Paragraph, CheckBox, FormField, TextInput, Anchor } from 'grommet'

import { FormModal, InvestmentSteps } from './styles'
import { Pool, UpcomingPool } from '../../config'
// import { getPoolStatus } from '../../utils/pool'

interface Props {
  anchor?: React.ReactNode
  pool?: Pool | UpcomingPool
}

const InvestAction: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const [newsletter, setNewsletter] = React.useState(false)
  const [email, setEmail] = React.useState('')

  const onOpen = () => setModalIsOpen(true)
  const onClose = () => setModalIsOpen(false)

  const changeEmail = (event: any) => {
    setEmail(event.currentTarget.value)
    // error = 'Please provide a valid email address'
  }

  const investDisabled = props.pool?.isUpcoming || !props.pool?.securitizeId

  return (
    <>
      {props.pool && (
        <Box margin={{ left: 'auto' }}>
          <Button primary label="Get started" fill={false} onClick={onOpen} />
        </Box>
      )}
      {!props.pool && (
        <Anchor
          onClick={onOpen}
          margin={{ top: 'small', bottom: 'small' }}
          label="Interested in investing in Tinlake Pools? Start your onboarding process now"
        />
      )}

      <FormModal opened={modalIsOpen} title={'Interested in investing?'} onClose={onClose}>
        <Paragraph margin={{ top: 'small', bottom: 'small' }}>
          Tinlake has integrated Securitize.io’s automated KYC process for a smooth investor onboarding. Once Securitize
          has verified your documentation you will be provided with your “Securitize iD” which makes you eligible to
          invest in all open Tinlake pools. To invest in an individual pool you will be asked to sign the subscription
          agreement with the pool’s issuer also provided through the Securitize dashboard.
        </Paragraph>

        <InvestmentSteps src="/static/kyc-steps.svg" alt="Investment steps" />

        {!props.pool && (
          <Box margin={{ left: 'auto', right: 'auto' }} width="40%">
            <Box direction="row">
              <Box style={{ minWidth: '40px', paddingTop: '14px', paddingLeft: '4px' }}>
                <CheckBox
                  name="check"
                  checked={newsletter}
                  onChange={(event: any) => setNewsletter(event.target.checked)}
                />
              </Box>
              <Box flex={'grow'}>
                <Paragraph>
                  Sign me up to Centrifuge newsletters, for monthly updates on new pools and major Centrifuge
                  announcements.
                </Paragraph>
              </Box>
            </Box>
            {newsletter && (
              <Box flex={true} margin={{ top: '0' }}>
                <FormField>
                  <TextInput value={email} onChange={changeEmail} placeholder="you@example.com" />
                </FormField>
              </Box>
            )}
          </Box>
        )}

        <Box
          direction="row"
          justify="center"
          width={props.pool ? '80%' : '40%'}
          margin={{ left: 'auto', right: 'auto' }}
          gap="medium"
          style={{ textAlign: 'center' }}
        >
          <Box flex={true} justify="between">
            <Paragraph>Start your KYC process to become to become an eligible investor.</Paragraph>
            <Button
              primary
              label={newsletter ? `Sign up & onboard as investor` : `Onboard as an investor`}
              fill={false}
              href="https://centrifuge.invest.securitize.io/"
              target="_blank"
            />
          </Box>
          {props.pool && (
            <Box flex={true} justify="between">
              {(props.pool?.isUpcoming || !props.pool.securitizeId) && (
                <Paragraph>This pool is not open for investments yet</Paragraph>
              )}
              {!investDisabled && (
                <Paragraph>Already an eligible investor? Sign the pool issuers Subscription Agreement.</Paragraph>
              )}
              <Button
                primary
                label="Invest in this pool"
                fill={false}
                href={`https://${props.pool.securitizeId || ''}.invest.securitize.io/`}
                target="_blank"
                disabled={investDisabled}
              />
            </Box>
          )}
        </Box>

        {props.pool && (
          <Paragraph
            margin={{ top: 'medium', bottom: '0', left: 'large', right: 'large' }}
            style={{ textAlign: 'center' }}
          >
            Any questions left? Feel free to reach out to the Issuer directly (see{' '}
            <a href="#" onClick={onClose}>
              Pool Overview
            </a>
            ).
          </Paragraph>
        )}

        {!props.pool && (
          <Paragraph
            margin={{ top: 'medium', bottom: '0', left: 'large', right: 'large' }}
            style={{ textAlign: 'center' }}
          >
            Already an eligible Tinlake investor? Head over to the individual pools to get started with signing the
            subscription agreement or login to Securitize and select the respective pool there.
          </Paragraph>
        )}
      </FormModal>
    </>
  )
}

export default InvestAction
