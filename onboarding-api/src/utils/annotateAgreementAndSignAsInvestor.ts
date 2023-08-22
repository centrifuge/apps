import { Request } from 'express'
import fetch from 'node-fetch'
import { PDFDocument } from 'pdf-lib'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import { onboardingBucket } from '../database'
import { HttpError } from './httpError'
import { getCentrifuge } from './networks/centrifuge'
import { NetworkSwitch } from './networks/networkSwitch'

interface SignatureInfo extends Omit<InferType<typeof signAndSendDocumentsInput>, 'debugEmail'> {
  name: string
  wallet: Request['wallet']
  email: string
}

const GENERIC_SUBSCRIPTION_AGREEMENT = 'QmYuPPQuuc9ezYQtgTAupLDcLCBn9ZJgsPjG7mUx7qbN8G'

export const annotateAgreementAndSignAsInvestor = async ({
  poolId,
  trancheId,
  transactionInfo,
  wallet,
  name,
  email,
}: SignatureInfo) => {
  const { pool, metadata } = await new NetworkSwitch(wallet.network).getPoolById(poolId)
  const trancheName = pool?.tranches.find((t) => t.id === trancheId)?.currency.name as string
  const centrifuge = getCentrifuge()
  const signaturePage = await onboardingBucket.file('signature-page.pdf')
  const [signaturePageExists] = await signaturePage.exists()

  if (!signaturePageExists) {
    throw new HttpError(400, 'Signature page not found')
  }

  const unsignedAgreementUrl = metadata?.onboarding?.tranches?.[trancheId]?.agreement?.uri
    ? centrifuge.metadata.parseMetadataUrl(metadata?.onboarding?.tranches?.[trancheId]?.agreement?.uri)
    : !pool.id.startsWith('0x')
    ? // TODO: remove generic and don't allow onboarding if agreement is not uploaded
      centrifuge.metadata.parseMetadataUrl(GENERIC_SUBSCRIPTION_AGREEMENT)
    : null

  // tinlake pools that are closed for onboarding don't have agreements in their metadata
  if (!unsignedAgreementUrl) {
    throw new HttpError(400, 'Agreement not found')
  }

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
    `Signed by ${wallet.address} on Centrifuge
Block: ${transactionInfo.blockNumber}
Transaction hash: ${transactionInfo.txHash}
Agreement hash: ${unsignedAgreementUrl}`,
    {
      x: 30,
      y: firstPage.getSize().height - 30,
      size: 10,
      maxWidth: firstPage.getSize().width - 60,
      wordBreaks: [''],
      lineHeight: 12,
    }
  )

  lastPage.drawText(wallet.address, {
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

  // all tinlake agreements require the executive summary to be appended
  if (pool.id.startsWith('0x')) {
    const execSummaryRes = await fetch(metadata.pool.links.executiveSummary.uri)
    const execSummary = Buffer.from(await execSummaryRes.arrayBuffer())
    const execSummaryPdf = await PDFDocument.load(execSummary)
    const execSummaryCopiedPages = await signedAgreement.copyPages(execSummaryPdf, execSummaryPdf.getPageIndices())
    execSummaryCopiedPages.forEach((page) => signedAgreement.addPage(page))
  }

  const signedAgreementPDF = await signedAgreement.save()
  return signedAgreementPDF
}
