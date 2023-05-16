import { PDFDocument, StandardFonts } from 'pdf-lib'
import { onboardingBucket } from '../database'
import { getPoolById } from './getPoolById'
import { HttpError } from './httpError'

type SignatureInfo = {
  poolId: string
  trancheId: string
  walletAddress: string
  investorName: string
}

export const signAcceptanceAsIssuer = async ({ poolId, trancheId, walletAddress, investorName }: SignatureInfo) => {
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

  const { metadata, pool } = await getPoolById(poolId)

  const issuerRepName = metadata?.pool.issuer.repName

  const trancheName = pool?.tranches.find((t) => t.id === trancheId)?.currency.name as string

  const timesNewRoman = await countersignedAgreement.embedFont(StandardFonts.TimesRoman)

  const { width } = lastPage.getSize()

  lastPage.drawText(trancheName, {
    font: timesNewRoman,
    x: width - 75 - timesNewRoman.widthOfTextAtSize(trancheName, 12),
    y: 702,
    size: 12,
  })

  lastPage.drawText(investorName, {
    x: 203,
    y: 361,
    size: 12,
  })

  lastPage.drawText(new Date().toISOString(), {
    x: 174,
    y: 326,
    size: 12,
  })

  lastPage.drawText(issuerRepName, {
    x: 94,
    y: 199,
    size: 12,
  })

  lastPage.drawText(issuerRepName, {
    x: 109,
    y: 159,
    size: 12,
  })

  const countersignedAgreementPDF = await countersignedAgreement.save()

  return countersignedAgreementPDF
}
