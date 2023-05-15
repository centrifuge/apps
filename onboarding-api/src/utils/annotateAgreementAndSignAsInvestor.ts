import fetch from 'node-fetch'
import { PDFDocument } from 'pdf-lib'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import { onboardingBucket } from '../database'
import { centrifuge } from './centrifuge'
import { getPoolById } from './getPoolById'
import { HttpError } from './httpError'

interface SignatureInfo extends InferType<typeof signAndSendDocumentsInput> {
  name: string
  walletAddress: string
  email: string
}

const GENERIC_SUBSCRIPTION_AGREEMENT = 'QmYuPPQuuc9ezYQtgTAupLDcLCBn9ZJgsPjG7mUx7qbN8G'

export const annotateAgreementAndSignAsInvestor = async ({
  poolId,
  trancheId,
  transactionInfo,
  walletAddress,
  name,
  email,
}: SignatureInfo) => {
  const { pool } = await getPoolById(poolId)
  const trancheName = pool?.tranches.find((t) => t.id === trancheId)?.currency.name as string
  const { metadata } = await getPoolById(poolId)

  const signaturePage = await onboardingBucket.file('signature-page.pdf')
  const [signaturePageExists] = await signaturePage.exists()

  if (!signaturePageExists) {
    throw new HttpError(400, 'Signature page not found')
  }

  const unsignedAgreementUrl = metadata?.onboarding?.agreements[trancheId]
    ? centrifuge.metadata.parseMetadataUrl(metadata?.onboarding?.agreements[trancheId].ipfsHash)
    : centrifuge.metadata.parseMetadataUrl(GENERIC_SUBSCRIPTION_AGREEMENT)
  const unsignedAgreementRes = await fetch(unsignedAgreementUrl)
  const unsignedAgreement = Buffer.from(await unsignedAgreementRes.arrayBuffer())
  const unsignedAgreementPdfDoc = await PDFDocument.load(unsignedAgreement)

  const signaturePagePdf = await signaturePage.download()
  const signaturePagePdfDoc = await PDFDocument.load(signaturePagePdf[0])

  const signedAgreement = await PDFDocument.create()
  const unsignedAgreementCopiedPages = await signedAgreement.copyPages(
    unsignedAgreementPdfDoc,
    unsignedAgreementPdfDoc.getPageIndices()
  )
  const [signaturePageCopy] = await signedAgreement.copyPages(signaturePagePdfDoc, [0])

  unsignedAgreementCopiedPages.forEach((page) => signedAgreement.addPage(page))
  signedAgreement.addPage(signaturePageCopy)

  const pages = signedAgreement.getPages()

  const [firstPage] = pages
  const lastPage = pages[pages.length - 1]

  firstPage.drawText(
    `Signed by ${walletAddress} on Centrifuge
Block: ${transactionInfo.blockNumber}
Transaction Hash: ${transactionInfo.txHash}`,
    {
      x: 30,
      y: firstPage.getSize().height - 30,
      size: 10,
      maxWidth: firstPage.getSize().width - 60,
      wordBreaks: [''],
      lineHeight: 12,
    }
  )

  lastPage.drawText(walletAddress, {
    x: 72,
    y: 582,
    size: 12,
  })

  lastPage.drawText(trancheName, {
    x: 107,
    y: 471,
    size: 12,
  })

  lastPage.drawText(name, {
    x: 204,
    y: 376,
    size: 12,
  })

  lastPage.drawText(email, {
    x: 151,
    y: 344,
    size: 12,
  })

  lastPage.drawText(new Date().toISOString(), {
    x: 103,
    y: 310,
    size: 12,
  })

  const signedAgreementPDF = await signedAgreement.save()

  return signedAgreementPDF
}
