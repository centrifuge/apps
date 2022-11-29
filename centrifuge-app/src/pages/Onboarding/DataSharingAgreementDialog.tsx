import { Button, Dialog, Flex, Stack, Text } from '@centrifuge/fabric'

type Props = {
  isDataSharingAgreementDialogOpen: boolean
  setIsDataSharingAgreementDialogOpen: (isDataSharingAgreementDialogOpen: boolean) => void
}

export const DataSharingAgreementDialog = ({
  isDataSharingAgreementDialogOpen,
  setIsDataSharingAgreementDialogOpen,
}: Props) => (
  <Dialog
    width="50%"
    isOpen={isDataSharingAgreementDialogOpen}
    onClose={() => setIsDataSharingAgreementDialogOpen(false)}
    title={<Text variant="heading1">Data Sharing Consent</Text>}
  >
    <Stack height="452px" gap={3} overflowY="scroll">
      <Text variant="heading2">Consent to data transfer</Text>
      <Text>
        Shufti Pro Limited enables Investors to disclose their personal data to issuers of such Investors' choosing.
        Investors located in the European Economic Area ("EEA") or the United Kingdom should be aware that these
        disclosures may involve transfers to countries that do not provide the same level of protection for personal
        data as their home countries. Please note that this Data Transfer Consent Form should be read in conjunction
        with our GLBA Privacy Notice and (for EEA and UK residents) our GDPR Privacy Notice. Any defined terms not
        defined herein take their meaning from those notices or the Shufti Pro Terms and Conditions. The below
        information contains key details regarding these transfers:
      </Text>
      <Text variant="heading2">Controllers' Identities</Text>
      <Text>
        Shufti Pro Limited and its wholly-owned subsidiaries ("Shufti Pro") and the issuer(s) to which you authorize the
        transfer.
      </Text>
      <Text variant="heading2">Purpose of Transfer</Text>
      <Text>
        Shufti Pro will access and transfer your personal data to the issuer(s) you identify. One or more issuer may be
        located in the United States or in other jurisdictions outside the EEA or the United Kingdom.
      </Text>
      <Text variant="heading2">What type of data will be disclosed?</Text>
      <Text>
        Shufti Pro will disclose your personal data stored in your account for the purpose set forth above. That
        information includes each category of personal data identified in the GLBA Notice or GDPR Notice, as applicable.
      </Text>
      <Text variant="heading2">Withdrawal of Consent</Text>
      <Text>
        Shufti Pro only facilitates the initial disclosure to the issuers that you have affirmatively selected. Should
        you no longer want to communicate with a particular issuer after consenting to the disclosure discussed herein,
        or if you wish that issuer to delete the personal data it has been provided pursuant to this consent, please
        contact that issuer directly.
      </Text>
      <Text variant="heading2">Risks of Data Transfer</Text>
      <Text>
        By consenting to this disclosure, your information will be transferred to the country in which the particular
        issuers you have selected are located. ***According to EEA regulations, the United States does not provide an
        "adequate" level of protection for purposes of data protection, and no alternative safeguards are in place for
        this particular transfer. Further, the issuer you have selected may be located in the United States or in
        another country that does not provide such adequate levels of protection or safeguards. As such, your
        information may be at risk of unauthorized or unwanted access.
      </Text>
      <Text>
        ***Please note, however, that Shufti Pro takes the security of your information seriously and implements
        organizational and technical measures to ensure a level of security for your personal data appropriate to these
        risks.
      </Text>
      <Text variant="heading2">Your Consent</Text>
      <Text>
        By consenting to the data transfer, you acknowledge you have read and consent to the transfer of your personal
        data as set forth herein. You may decline to consent to this transfer, in which case Shufti Pro will not be able
        to carry out your direction to disclose your personal information to your selected issuer.
      </Text>
    </Stack>
    <Flex justifyContent="flex-end">
      <Button onClick={() => setIsDataSharingAgreementDialogOpen(false)}>Close</Button>
    </Flex>
  </Dialog>
)
