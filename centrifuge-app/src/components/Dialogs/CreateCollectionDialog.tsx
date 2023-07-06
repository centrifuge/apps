import { CollectionMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/nfts'
import {
  ConnectionGuard,
  useAsyncCallback,
  useBalances,
  useCentrifuge,
  useCentrifugeTransaction,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FileUpload,
  Shelf,
  Stack,
  Text,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import * as React from 'react'
import { Redirect } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { collectionMetadataSchema } from '../../schemas'
import { Dec } from '../../utils/Decimal'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { useAddress } from '../../utils/useAddress'
import { ButtonGroup } from '../ButtonGroup'

// TODO: replace with better fee estimate
const CREATE_FEE_ESTIMATE = 2

const MAX_FILE_SIZE_IN_BYTES = 1024 ** 2 // 1 MB limit by default
const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [name, setName] = React.useState<string>('')
  const [description, setDescription] = React.useState<string>('')
  const [logo, setLogo] = React.useState<File | null>(null)
  const cent = useCentrifuge()
  const address = useAddress('substrate')
  const balances = useBalances(address)
  const [redirect, setRedirect] = React.useState<string>('')
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)

  const isConnected = !!address

  const {
    execute: doTransaction,
    lastCreatedTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransaction('Create collection', (cent) => cent.nfts.createCollection, {
    onSuccess: ([collectionId]) => {
      setRedirect(`/nfts/collection/${collectionId}`)
    },
  })

  const {
    execute,
    isLoading: metadataIsUploading,
    isError: uploadError,
    reset: resetUpload,
  } = useAsyncCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const nameValue = name.trim()
    const descriptionValue = description.trim()
    if (!isConnected || !nameValue || !descriptionValue) return

    const collectionId = await cent.nfts.getAvailableCollectionId()

    let fileDataUri
    let imageMetadataHash
    if (logo) {
      fileDataUri = await getFileDataURI(logo)
      imageMetadataHash = await lastValueFrom(cent.metadata.pinFile(fileDataUri))
    }

    const metadataValues: CollectionMetadataInput = {
      name: nameValue,
      description: descriptionValue,
      image: imageMetadataHash?.ipfsHash,
    }

    doTransaction([collectionId, address, metadataValues])
  })

  // Only close if the modal is still showing the last created collection
  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function reset() {
    setName('')
    setDescription('')
    resetLastTransaction()
    resetUpload()
    setConfirmOpen(false)
    setTermsAccepted(false)
  }

  function close() {
    reset()
    onClose()
  }

  const balanceDec = balances?.native.balance.toDecimal() ?? Dec(0)
  const balanceLow = balanceDec.lt(CREATE_FEE_ESTIMATE)
  const isTxPending = metadataIsUploading || transactionIsPending

  const fieldDisabled = !isConnected || balanceLow || isTxPending
  const disabled = !isConnected || !name.trim() || !description.trim() || balanceLow || isTxPending

  if (redirect) {
    return <Redirect to={redirect} />
  }

  const confirmDisabled = !termsAccepted

  return (
    <>
      <Dialog isOpen={open && !confirmOpen} onClose={close} title="Create new collection">
        <ConnectionGuard networks={['centrifuge']}>
          <form onSubmit={execute}>
            <Stack gap={3}>
              <TextInput
                label="Name"
                value={name}
                maxLength={collectionMetadataSchema.name.maxLength}
                onChange={(e) => setName(e.target.value)}
                disabled={fieldDisabled}
              />
              <TextAreaInput
                label="Description"
                value={description}
                maxLength={collectionMetadataSchema.description.maxLength}
                onChange={(e) => setDescription(e.target.value)}
                disabled={fieldDisabled}
              />
              <FileUpload
                label="Collection logo (JPEG, SVG, PNG, or GIF up to 1 MB)"
                placeholder="Choose image"
                file={logo}
                onFileChange={(file) => setLogo(file)}
                validate={(file) => {
                  if (!isImageFile(file)) {
                    return 'File format not supported'
                  }
                  if (file.size > MAX_FILE_SIZE_IN_BYTES) {
                    return 'File too large'
                  }
                }}
                accept="image/*"
              />
              <Shelf justifyContent="space-between">
                {balanceLow && (
                  <Text variant="label1" color="criticalForeground">
                    Your balance is too low ({(balanceDec || 0).toFixed(2)} AIR)
                  </Text>
                )}
                <ButtonGroup ml="auto">
                  <Button variant="secondary" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={disabled}>
                    Next
                  </Button>
                </ButtonGroup>
              </Shelf>
            </Stack>
          </form>
        </ConnectionGuard>
      </Dialog>
      <Dialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <form onSubmit={execute}>
          <Stack gap={3}>
            <Text variant="heading2" as="h2">
              Terms of use
            </Text>
            <Box p={2} maxHeight="50vh" overflowY="scroll" backgroundColor="backgroundInput" borderRadius="input">
              <Text style={{ whiteSpace: 'pre-wrap' }}>{terms}</Text>
            </Box>
            <Checkbox onChange={(e) => setTermsAccepted(e.target.checked)} label="I agree to the terms of use" />
            <Shelf justifyContent="space-between">
              <ButtonGroup ml="auto">
                {uploadError && <Text color="criticalPrimary">Failed to create collection</Text>}
                <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isTxPending} disabled={confirmDisabled}>
                  Create Collection
                </Button>
              </ButtonGroup>
            </Shelf>
          </Stack>
        </form>
      </Dialog>
    </>
  )
}

const terms = `These terms of use are between you as the user and the Centrifuge Network Foundation, Floor 4, Willow House, Cricket Square, Grand Cayman KY1-9010 Cayman Islands (the “Network”), the owner and operator of the NFT Playground app. The terms “we,” “us,” and “our” refer to the Network. “You” refers to you, as a user of our NFT Playground app (the “Service”).

The following Terms of Use apply when you view or use the Service. Please review the following terms carefully. By accessing or using the Service, you signify your agreement to these Terms of Use. If you do not agree to be bound by these Terms of Use in their entirety, you may not access or use the Service. 

A.        Representations. In using the Service, you hereby represent the following (such representation to be repeated each time you access the Service):

1) YOU ARE GRANTING THE NETWORK AND ITS AFFILIATES THE RIGHT TO USE YOUR CONTENT.

2) YOU CREATED THE CONTENT OR HAVE PERMISSION FROM THE CREATOR OF THE CONTENT TO GRANT THE RIGHT TO USE THE CONTENT.

3) YOU HAVE  ALL NECESSARY RIGHTS AND PERMISSIONS TO GRANT THE RIGHT TO USE THE CONTENT.

4) YOU UNDERSTAND THAT ANY CONTENT THAT VIOLATES THESE TERMS, ANY APPLICABLE LAW OR REGULATION CAN AND WILL BE REMOVED FROM THE SERVICE.

5) YOU ARE AT LEAST 18 YEARS OF AGE OR THE AGE OF MAJORITY, WHICHEVER IS OLDER, IN YOUR STATE AND/OR COUNTRY OF RESIDENCE.

6) YOU ARE NOT RESIDENT IN ANY COUNTRY SUBJECT TO A US OR EU OR UN SANCTION REGIME AND YOU ARE NOT CONSIDERED A SPECIALLY DESIGNATED NATIONAL OR BLOCKED PERSON BY THE US GOVERNMENT.

B.        Privacy. The Network respects the privacy of its Service users. Please refer to the Network’s Privacy Policy set forth on our website, which explains how we collect, use, and disclose information that pertains to  privacy. When you access or use the Service, you signify your agreement to the Privacy Policy as well as these Terms of Use.

C.         The Service. The Service allows you to create non-fungible tokens and upload user created content to our servers and other third party affiliates, manage existing non-fungible tokens, browse non-fungible tokens created using the Service and enter into transactions in relation to such non-fungible tokens. You agree to notify us immediately of any unauthorized use of your password and/or account. The Network will not be responsible for any liabilities, losses, or damages arising out of the unauthorized use of your user name, password and/or account.

D. Use Restrictions. Your permission to use the Service is conditioned upon the following use, posting and conduct restrictions. You agree that you will not under any circumstances:

1.  access the Service for any reason other than your personal, non-commercial use solely as permitted by the normal functionality of the Service;
2.  collect or harvest any personal data of any user of the Service;
3.  use the Service for the solicitation of business in the course of trade or in connection with a commercial enterprise;
4.  use the Service for any unlawful purpose or for the promotion of illegal activities;
5.  attempt to, or harass, abuse or harm another person or group;
6.  interfere or attempt   to interfere with the proper functioning of the Service;
7.  make any automated use of the Service, or take any action that we deem to impose or to potentially impose an unreasonable or disproportionately large load on our servers or network infrastructure; or
8.  use any software, technology, or device to scrape, spider, or crawl the Service or harvest or manipulate data.

E. Content Restrictions. You are solely responsible for the content that you post, upload, link to or otherwise make available via the Service. You agree that we are only acting as a passive conduit for your online distribution and publication of your content. The Network, however, reserves the right to remove any  content from the Service at its sole discretion. We grant you permission to use and access the Service, subject to the following express conditions surrounding content. You agree that failure to adhere to any of these conditions constitutes a material breach of these Terms. By transmitting and submitting any content using the Service, you agree:

1. You are solely responsible for your account and your activity.
2. You will not post content that is malicious, libelous, false or inaccurate.
3. You will not post content that is abusive, threatening, obscene, defamatory, libelous, or racially, sexually, religiously, or otherwise objectionable and offensive.
4. You will not submit content that is copyrighted or subject to third party proprietary rights, including privacy, publicity, trade secret, or others, unless you are the owner of such rights or have the appropriate permission from their rightful owner to specifically submit such content.

You hereby agree that we have the right to determine whether your content submissions are appropriate and comply with these Terms of Service, remove any and/or   all of your content, and terminate your account with or without prior notice.

You understand and agree that any liability, loss or damage that occurs as a result of the use of any of your content that you make available or access through your use of the Service is solely your responsibility. The Service is not responsible for any public display or misuse of your content. 

The Service does not, and cannot, pre-screen or monitor all user content. However, at our discretion, we, or technology we employ, may monitor and/or record your interactions with  the Service or with other users.

F.        Ownership Rights. You retain all ownership rights in your content but you are required to grant the following rights to the Network as set forth more fully under the “License Grant” and “Intellectual Property” provisions below. When you upload or post content to the Service, you grant to the Network a worldwide, non-exclusive, royalty free, transferable license to use, reproduce, distribute, prepare derivative works of and display your content  in connection with the provision of the Service. You grant to each user of the Service, a worldwide, non-exclusive, royalty-free license to access your content through the Service, and to use, reproduce, distribute, prepare derivative works of and display your content to the extent permitted by the Service and under these Terms of Use.

G.        Online Content Disclaimer. Opinions, advice, statements, offers, or other information or content made available through the Service, but not directly by the Service, are those of their respective authors, and should not necessarily be relied upon. Such authors are solely responsible for such content.
We do not guarantee the accuracy, completeness, or usefulness of any information on the Service nor do we adopt or endorse, or are we responsible for, the accuracy   or reliability of any opinion, advice, or statement made by other parties. We take no responsibility and assume no liability for any user content that you or any other user or third party posts or sends via the Service. Under no circumstances will we be responsible for any loss or damage resulting from anyone’s reliance on information or other content posted on the Service, or transmitted to users.
In using the Service, you may be exposed to content that  is inaccurate or objectionable when you use or access the Service. We reserve the right, but have no obligation, to monitor the materials posted in the Service or to limit or deny a user’s access to the Service or take other appropriate action if a user violates these Terms of Use or engages in any activity that violates the rights of any person or entity or which we deem unlawful, offensive, abusive, harmful or malicious. The Network shall have the right to remove any material that in its sole opinion violates, or is alleged to violate, the law or this agreement or which might be offensive, or that might violate the rights, harm, or threaten the safety of users or others.

Unauthorized use may result in criminal and/or civil prosecution under applicable law. If you become aware of a misuse of our Service or violation of these Terms of Use, please contact us at support@centrifuge.io.

H.        Copyright Complaints.

1) We respect intellectual property and require that users do the same. We have adopted and implemented a policy that provides for the termination in appropriate circumstances of users of the Service who are repeat infringers.  We may terminate access for users who post protected third party content without necessary rights and permissions. 

2) If you are a copyright owner or an agent thereof and believe, in good faith, that any materials provided on the Service infringe upon your copyrights, you may submit a notification pursuant to the Digital Millennium Copyright Act by sending the following information in writing to the our designated copyright agent at support@centrifuge.io.

a) The date of your notification;
b) A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed;
c) A description of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works at a single online site are covered by a single notification, a representative list of such works at that site;
d) A description of the material that is claimed to be infringing or to be the subject of infringing activity and information sufficient to enable us to locate such work; 
e) Information reasonably sufficient to permit the service provider to contact you, such  as an address, telephone number, and/or email address;
f) A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law; and
g) A  statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that  is allegedly infringed.

WARRANTY DISCLAIMER. THE SERVICE IS PROVIDED “AS IS,” WITHOUT WARRANTY OF ANY KIND. WITHOUT LIMITING THE FOREGOING, WE EXPRESSLY DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED OR STATUTORY, REGARDING THE SERVICE INCLUDING WITHOUT LIMITATION ANY WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, SECURITY, ACCURACY AND NON-INFRINGEMENT. WITHOUT LIMITING THE FOREGOING, WE MAKE NO WARRANTY OR REPRESENTATION THAT ACCESS TO OR OPERATION OF THE SERVICE WILL BE UNINTERRUPTED OR ERROR FREE. YOU ASSUME FULL RESPONSIBILITY AND RISK OF LOSS RESULTING FROM YOUR DOWNLOADING AND/OR USE OF FILES, INFORMATION, CONTENT OR OTHER MATERIAL OBTAINED FROM THE SERVICE. SOME JURISDICTIONS LIMIT OR DO NOT PERMIT DISCLAIMERS OF WARRANTY, SO THIS PROVISION MAY NOT APPLY TO YOU.

LIMITATION OF DAMAGES. TO THE EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE NETWORK, ITS AFFILIATES, DIRECTORS, OR EMPLOYEES, OR ITS LICENSORS OR PARTNERS, BE LIABLE TO YOU FOR ANY LOSS OF PROFITS, USE, OR DATA, OR FOR ANY INCIDENTAL, INDIRECT, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, HOWEVER ARISING, THAT RESULT FROM: (A) THE USE, DISCLOSURE, OR DISPLAY OF YOUR USER CONTENT; (B) YOUR USE OR INABILITY TO USE THE SERVICE; (C) THE SERVICE GENERALLY OR THE SOFTWARE OR SYSTEMS THAT MAKE THE SERVICE AVAILABLE; OR (D) ANY OTHER INTERACTIONS WITH USE OR WITH ANY OTHER USER OF THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE) OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE. SOME JURISDICTIONS LIMIT OR DO NOT PERMIT DISCLAIMERS OF LIABILITY, SO THIS PROVISION MAY NOT APPLY TO YOU. TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE NETWORK BE LIABLE  FOR ANY LOSS OF USE, LOST OR INACCURATE DATA, FAILURE OF SECURITY MECHANISMS, INTERRUPTION OF BUSINESS, COST OF PROCUREMENT OF SUBSTITUTE GOODS, SERVICES OR TECHNOLOGY OR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY KIND (INCLUDING LOST PROFITS OR LOST DATA), REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, EVEN IF INFORMED OF THE POSSIBILITY OF SUCH DAMAGES IN ADVANCE. TO THE   FULLEST EXTENT PERMITTED BY LAW.

I.        Indemnity. You agree that the Network and its affiliates and their respective shareholders, directors, officers, employees, representatives, agents, contractors, customers and licensees (collectively, the "Indemnified Parties") shall have no liability whatsoever for, and you shall indemnify and hold harmless the Indemnified Parties from and against, any and all claims, losses, damages, liabilities, costs and expenses (including reasonable lawyer’s fees) arising from, in connection with or related to: (a) any use the you make of the Service; (b) your relationships or interactions with any end users or third party distributors of your content; (c) your content; (d) your breach of these Terms; or (e) your negligence, willful misconduct or fraud.

J.        General Terms. 

We can amend these Terms of Use at any time and will update these Terms of Use in the event of any such amendments. It is your sole responsibility to check the Service from time to time to view any such changes in this agreement. Your continued use of the Service or the Service signifies your agreement to our revisions to these Terms of Use.
If any part of these Terms of Use is held or found to be invalid or unenforceable, that portion of the agreement will be construed as to be consistent with applicable law while  the remaining portions of the agreement will remain in full force and effect. Any failure on our part to enforce any provision of this agreement will not be considered a waiver of our right to enforce such provision. Our rights under this agreement survive any transfer or termination of this agreement.

These Terms of Use and your use of the Service are governed by the laws of the Cayman Islands, without regard to conflict of law provisions.

YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF USE, UNDERSTAND  THESE TERMS OF USE, AND WILL BE BOUND BY THESE TERMS OF USE. YOU FURTHER ACKNOWLEDGE THAT THESE TERMS OF USE TOGETHER WITH PRIVACY POLICY AT OUR WEBSITE REPRESENT THE COMPLETE AND EXCLUSIVE STATEMENT OF THE AGREEMENT BETWEEN US WHICH SUPERSEDE ANY PRIOR AGREEMENT ORAL OR WRITTEN, AND ANY OTHER COMMUNICATIONS BETWEEN US RELATING TO THE SUBJECT MATTER OF THIS AGREEMENT.`
