import Busboy from 'busboy'
import { HttpError } from '../utils/httpError'

// https://cloud.google.com/functions/docs/samples/functions-http-form-data#functions_http_form_data-nodejs
export const fileUpload = (req, res, next) => {
  const busboy = Busboy({ headers: req.headers })

  busboy.on('file', (_fieldname, _file, { mimeType }) => {
    if (mimeType !== 'application/pdf') {
      const error = new HttpError(400, 'Only PDF files are allowed')
      return res.status(error.code).send({ error: error.message })
    }
    next()
  })

  busboy.end(req.rawBody)
}
