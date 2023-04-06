import { File } from '@google-cloud/storage'
import { PDFDocument } from 'pdf-lib'
import { TransactionInfo } from '../database'

export const signAndAnnotateAgreement = async (
  unsignedAgreement: File,
  walletAddress: string,
  transactionInfo: TransactionInfo,
  name: string
) => {
  const pdf = await unsignedAgreement.download()
  const pdfDoc = await PDFDocument.load(pdf[0])

  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const lastPage = pages[pages.length - 1]

  firstPage.drawText(
    `Signed by ${walletAddress} on Centrifuge 
Block: ${transactionInfo.blockNumber}
Transaction Hash: ${transactionInfo.txHash}
Network: ${transactionInfo.network}
`,
    {
      x: 30,
      y: firstPage.getSize().height - 30,
      size: 10,
      maxWidth: firstPage.getSize().width - 60,
      wordBreaks: [''],
      lineHeight: 12,
    }
  )

  lastPage.drawText(name, {
    x: 72,
    y: 408,
    size: 20,
  })

  return pdfDoc
}
