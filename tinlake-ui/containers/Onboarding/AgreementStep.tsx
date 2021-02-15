import { Modal } from '@centrifuge/axis-modal'
import { AgreementsStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, CheckBox, Heading, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import config, { Pool } from '../../config'
import { OnboardingState } from '../../ducks/onboarding'
import { FormFieldWithoutBorder, LegalCopy, Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
  tranche?: 'senior' | 'junior'
  onboarding: OnboardingState
  agreement: AgreementsStatus | undefined
  agreementStatus: 'none' | 'signed' | 'countersigned'
  whitelistStatus: boolean
}

const KycStep: React.FC<Props> = (props: Props) => {
  const [checked, setChecked] = React.useState(false)
  const [error, setError] = React.useState('')

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : '' // TODO: check this on the API and display message if it has expired

  const poolName = props.activePool.metadata.shortName || props.activePool.metadata.name

  const awaitingWhitelisting = props.agreementStatus === 'countersigned' && props.whitelistStatus === false

  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <Step>
      <StepHeader>
        {(props.agreementStatus === 'signed' || awaitingWhitelisting) && <StepIcon pending />}
        {!(props.agreementStatus === 'signed' || awaitingWhitelisting) && (
          <StepIcon
            inactive={!props.active}
            checked={props.agreementStatus === 'countersigned' && props.whitelistStatus === true}
          />
        )}
        <StepTitle inactive={!props.active && !awaitingWhitelisting}>
          {props.agreementStatus === 'none'
            ? `Sign the Subscription Agreement`
            : props.agreementStatus === 'countersigned' && props.whitelistStatus === true
            ? `${props.agreement?.name} signed`
            : `${props.agreement?.name} awaiting Issuer signature`}
        </StepTitle>
      </StepHeader>
      {props.active && props.agreementStatus === 'none' && props.agreement && !session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '70%' }}>
            To complete the next step of signing the {props.agreement.name} for {poolName}, you can sign in again with
            your Securitize iD.
          </Paragraph>
          <div>
            <Button primary label={'Sign in with Securitize'} href={props.onboarding.data?.kyc?.url} fill={false} />
          </div>
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.agreementStatus === 'none' && props.agreement && session && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Finalize onboarding by signing the {props.agreement.name} for {poolName}.
          </Paragraph>
          {!props.onboarding.data?.kyc.isUsaTaxResident && (
            <Box margin={{ right: 'auto', bottom: 'medium' }}>
              <FormFieldWithoutBorder error={error}>
                <CheckBox
                  checked={checked}
                  label={
                    <div style={{ lineHeight: '2em' }}>
                      I consent to the transfer of my personal data to the issuer and to Securitize’s and Centrifuge’s
                      Privacy Policy and Terms and Conditions.&nbsp;
                      <Anchor
                        onClick={(event: any) => {
                          openModal()
                          event.preventDefault()
                        }}
                        style={{ display: 'inline' }}
                        label="View more"
                      />
                      .
                    </div>
                  }
                  onChange={(event) => setChecked(event.target.checked)}
                />
              </FormFieldWithoutBorder>
            </Box>
          )}
          <div>
            <Button
              primary
              label={`Sign Subscription Agreement`}
              href={`${config.onboardAPIHost}pools/${(props.activePool as Pool).addresses.ROOT_CONTRACT}/agreements/${
                props.agreement?.provider
              }/${props.agreement?.providerTemplateId}/redirect?session=${session}`}
              onClick={(event: any) => {
                if (!props.onboarding.data?.kyc.isUsaTaxResident && !checked) {
                  event.preventDefault()
                  setError('This needs to be checked to proceed.')
                }
              }}
              fill={false}
            />
          </div>
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {props.active && props.agreement && (props.agreementStatus === 'signed' || awaitingWhitelisting) && (
        <StepBody>
          <Box pad={{ vertical: 'medium' }}>
            The Issuer will counter-sign your {props.agreement.name} for {poolName} soon. If KYC is verified, you will
            be ready to invest in this pool upon their signature.
          </Box>
        </StepBody>
      )}
      {/* TODO: or not whitelisted */}
      {!props.active && <StepBody inactive>&nbsp;</StepBody>}
      {props.agreementStatus === 'countersigned' && props.whitelistStatus === true && <StepBody>&nbsp;</StepBody>}

      <Modal
        opened={modalIsOpen}
        title={
          'Consent to the transfer of my personal data to the issuer I have identified and to Securitize’s and Centrifuge’s Privacy Policy and Terms and Conditions.'
        }
        headingProps={{ style: { maxWidth: '100%', display: 'flex' } }}
        titleIcon={<StatusInfoIcon />}
        onClose={closeModal}
      >
        <LegalCopy>
          <Paragraph margin={{ top: 'medium' }}>
            Your Securitize I.D. enables you (the investor) to direct Securitize to disclose your personal data to
            issuers you are choosing. Investors located in the European Economic Area (“EEA”) or the United Kingdom
            should be aware that these disclosures may involve transfers to countries that do not provide the same level
            of protection for personal data as their home countries. Please note that this Data Transfer Consent Form
            should be read in conjunction with Securitize's GLBA Privacy Notice and (for EEA and UK residents) our GDPR
            Privacy Notice. Any defined terms not defined herein take their meaning from those notices or the Securitize
            Platform Terms of Service.
          </Paragraph>
          <Paragraph margin={{ top: 'medium' }}>
            Securitize will access and transfer your personal data to the issuer you identify. That issuer may be
            located in the United States or in other jurisdictions outside the EEA or the United Kingdom. What type of
            data will be disclosed? Securitize will disclose your personal data stored in your “Securitize I.D.” for the
            purpose set forth above. That information includes each category of personal data identified in the GLBA
            Notice or GDPR Notice, as applicable.
          </Paragraph>
          <Paragraph margin={{ top: 'medium' }}>
            Securitize only facilitates the initial disclosure to the issuers that you have affirmatively selected.
            Should you no longer want to communicate with a particular issuer after consenting to the disclosure
            discussed herein, or if you wish that issuer to delete the personal data it has been provided pursuant to
            this consent, please contact that issuer directly.
          </Paragraph>
          <Paragraph margin={{ top: 'medium' }}>
            By consenting to this disclosure via Securitize I.D., your information will be transferred to the country in
            which the particular issuers you have selected is located. According to EEA regulations, the United States
            does not provide an “adequate” level of protection for purposes of data protection, and no alternative
            safeguards are in place for this particular transfer. Further, the issuer you have selected may be located
            in the United States or in another country that does not provide such adequate levels of protection or
            safeguards. As such, your information may be at risk of unauthorized or unwanted access. Please note,
            however, that Securitize takes the security of your information seriously and implements organizational and
            technical measures to ensure a level of security for your personal data appropriate to these risks. Content
            of Issuer Website. Securitize is not responsible for the content of the issuer’s website and makes no
            representations, assurances or endorsements regarding the content of such website, the issuer, the issuer’s
            operations and business activities, or any offering of securities which the issuer may make. All content on
            such issuer’s website is created at its sole discretion.
          </Paragraph>
          <Paragraph margin={{ top: 'medium' }}>
            You acknowledge you have read and consent to the transfer of your personal data as set forth herein. You may
            decline to consent to this transfer, in which case Securitize will not be able to carry out your direction
            to disclose your personal information to your selected issuer.
          </Paragraph>

          <Heading level="5" margin={{ bottom: 'small' }}>
            Terms and Conditions
          </Heading>
          <ul>
            <li>
              The information to which this website gives access is exclusively intended for persons who are not located
              in or resident of certain other restricted jurisdictions, and who are otherwise permitted to receive such
              information under applicable law.
            </li>
            <li>
              The information to which this website gives access does not constitute an offer or an invitation to
              purchase securities in any other jurisdiction in which such offer or invitation is not authorized or to
              any person to whom it is unlawful to make such offer or invitation.
            </li>
            <li>
              An investment in will be characterized by a high degree of risk, volatility and illiquidity. A prospective
              investor should thoroughly review the confidential information contained herein and the terms of the
              relevant agreements, and carefully consider whether such an investment is suitable to the investor’s
              financial situation and goals.
            </li>
            <li>
              Certain economic and market information contained herein has been obtained from published sources prepared
              by other parties. While such sources are believed to be reliable, neither nor any of its affiliates assume
              any responsibility for the accuracy or completeness of such information. Neither delivery of this
              information nor any statement herein should be taken to imply that any information contained herein is
              correct as of any time subsequent to the date hereof.
            </li>
            <li>
              No person has been authorized to make any statement other than as set forth in the applicable offering
              documents, and any such statements, if made, must not be relied upon.
            </li>
            <li>
              Prospective investors are cautioned not to rely on any prior return information set forth herein in making
              a decision whether or not to invest. Any return information contained herein has not been audited or
              verified by any independent party and should not be considered representative of returns that may be
              received by an investor in . Certain factors exist that may affect comparability including, among others,
              the deduction of costs and service fees. Certain factual and statistical information contained herein has
              been obtained from published sources prepared by other parties and has not been independently verified by
              the issuer. Opinions and estimates may be changed without notice.
            </li>
            <li>
              Certain statements of past performance, and certain economic and market information, contained herein
              includes projections and estimates made by and other parties. Any projected returns and estimates of
              economic and market information contained herein involve risks and uncertainties and are based on
              assumptions concerning circumstances and events that have not yet occurred and may be subject to being
              influenced by events beyond the control of the issuer. Actual results could differ significantly. No
              representation or warranty, express or implied, is made by the issuer. As to the reasonableness or
              accuracy of the projections or estimates and, as a result, such projections and estimates should be viewed
              solely as an orderly representation of estimated results if underlying assumptions are realized. Investors
              should subject the projections and estimates to review by their own professional advisers.
            </li>
            <li>
              In considering the prior performance information contained herein, prospective investors should bear in
              mind that past performance is not necessarily indicative of future results, and there can be no assurance
              that will achieve comparable results.
            </li>
            <li>
              Prospective investors should make their own investigations and evaluations of the issuer, including the
              merits and risks involved in an investment therein. Prior to any investment, investors will have the
              opportunity to ask questions of and receive answers and additional information from concerning the terms
              and conditions of this offering and other relevant matters to the extent possesses the same or can acquire
              it without unreasonable effort or expense. Prospective investors should inform themselves as to the legal
              requirements applicable to them in respect of the acquisition, holding and disposition of the investment,
              and as to the income and other tax consequences to them of such acquisition, holding and disposition.
            </li>
            <li>
              This information does not constitute an offer to sell, or a solicitation of an offer to buy, an interest
              in any jurisdiction in which it is unlawful to make such an offer or solicitation. Neither the United
              States Securities and Exchange Commission nor any other federal, state or foreign regulatory authority has
              approved an investment. Furthermore, the foregoing authorities have not confirmed the accuracy or
              determined the adequacy of this information, nor is it intended that the foregoing authorities will do so.
              Any representation to the contrary is a criminal offense.
            </li>
            <li>
              Certain statements herein constitute forward-looking statements. When used herein, the words “may,”
              “will,” “should,” “project,” “anticipate,” “believe,” “estimate,” “intend,” “expect,” “continue,” and
              similar expressions or the negatives thereof are generally intended to identify forward-looking
              statements. Such forward-looking statements, including the intended actions and performance objectives of
              involve known and unknown risks, uncertainties, and other important factors that could cause the actual
              results, performance, or achievements of to differ materially from any future results, performance, or
              achievements expressed or implied by such forward-looking statements. No representation or warranty is
              made as to future performance or such forward-looking statements. All forward-looking statements herein
              speak only as of the date hereof. The issuer expressly disclaims any obligation or undertaking to
              disseminate any updates or revisions to any forward-looking statement contained herein to reflect any
              change in its expectation with regard thereto or any change in events, conditions, or circumstances on
              which any such statement is based.
            </li>
            <li>
              Prospective investors are not to construe this information as investment, legal, tax, regulatory,
              financial, accounting or other advice, and this information is not intended to provide the sole basis for
              any evaluation of this investment. Prior to acquiring an interest, a prospective investor should consult
              with its own legal, investment, tax, accounting, and other advisors to determine the potential benefits,
              burdens, and other consequences of such investment.
            </li>
            <li>
              By proceeding to view the materials to which this website gives access, you agree that you will not
              transmit or otherwise send any information to which this website gives access to any person in any
              jurisdiction in which the distribution of such information is restricted, or in which the offer or
              invitation to purchase tokens proposed to be issued by is not authorized, or to whom such offer or
              invitation may be unlawful.
            </li>
            <li>
              If you are located in, or are a resident of, a country in which the cross-border marketing of securities
              is restricted, you are confirming that you are requesting this information without having been being
              solicited or approached, directly or indirectly, by the issuer or any issuer's affiliate or issuer's
              partner or other person acting as agent or otherwise on behalf of the issuer.
            </li>
          </ul>
        </LegalCopy>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={closeModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </Step>
  )
}

export default KycStep
