import { PDFDocument, StandardFonts } from 'pdf-lib'
import { onboardingBucket, writeToOnboardingBucket } from '../database'
import { HttpError } from './httpError'

type SignatureInfo = {
  poolId: string
  trancheId: string
  walletAddress: string
  investorName: string
}

export const signSubscriptionAcceptance = async ({ poolId, trancheId, walletAddress, investorName }: SignatureInfo) => {
  const countersignedAgreement = await PDFDocument.create()

  const signedAgreement = await onboardingBucket.file(
    `signed-subscription-agreements/${walletAddress}/${poolId}/${trancheId}.pdf`
  )
  const [signedAgreementExists] = await signedAgreement.exists()

  if (!signedAgreementExists) {
    throw new HttpError(400, 'Signed agreement not found')
  }

  const acceptancePage = await onboardingBucket.file('acceptance-page.pdf')
  const [acceptancePageExists] = await acceptancePage.exists()

  if (!acceptancePageExists) {
    throw new HttpError(400, 'Acceptance page not found')
  }

  const signedAgreementPdf = await signedAgreement.download()
  const signedAgreementPdfDoc = await PDFDocument.load(signedAgreementPdf[0])

  const acceptancePagePdf = await acceptancePage.download()
  const acceptancePagePdfDoc = await PDFDocument.load(acceptancePagePdf[0])

  const signedAgreementCopiedPages = await countersignedAgreement.copyPages(
    signedAgreementPdfDoc,
    signedAgreementPdfDoc.getPageIndices()
  )
  const [acceptanceCopiedPage] = await countersignedAgreement.copyPages(acceptancePagePdfDoc, [0])

  signedAgreementCopiedPages.forEach((page) => countersignedAgreement.addPage(page))
  countersignedAgreement.addPage(acceptanceCopiedPage)

  const pages = countersignedAgreement.getPages()

  const lastPage = pages[pages.length - 1]

  // TODO: get issuer rep name
  const issuerRepName = 'Jane Issuer'
  // TODO: get pool name
  const issuerName = 'Some pool'

  const timesNewRoman = await countersignedAgreement.embedFont(StandardFonts.TimesRoman)

  lastPage.drawText(issuerName, {
    font: timesNewRoman,
    x: 423,
    y: 702,
    size: 12,
  })

  lastPage.drawText(investorName, {
    x: 207,
    y: 345,
    size: 12,
  })

  lastPage.drawText(new Date().toISOString(), {
    x: 175,
    y: 309,
    size: 12,
  })

  lastPage.drawText(issuerRepName, {
    x: 94,
    y: 182,
    size: 12,
  })

  lastPage.drawText(issuerRepName, {
    x: 109,
    y: 143,
    size: 12,
  })

  const countersignedAgreementPDF = await countersignedAgreement.save()

  await writeToOnboardingBucket(
    countersignedAgreementPDF,
    `signed-subscription-agreements/${walletAddress}/${poolId}/${trancheId}.pdf`
  )
}
