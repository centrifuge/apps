import { Flex } from '@centrifuge/fabric'
import * as React from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { Spinner } from './Spinner'
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

export const PDFViewer = ({ file }: { file: string }) => {
  const [numPages, setNumPages] = React.useState(0)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  return (
    <Document
      file={file}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={() => (
        <Flex alignItems="center" justifyContent="center" py={100}>
          <Spinner />
        </Flex>
      )}
    >
      {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
        <Page
          key={`page_${page}`}
          pageNumber={page}
          loading={() => (
            <Flex alignItems="center" justifyContent="center" py={100}>
              <Spinner />
            </Flex>
          )}
        />
      ))}
    </Document>
  )
}
