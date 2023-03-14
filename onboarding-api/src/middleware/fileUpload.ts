import fileUpload = require('express-fileupload')

export const fileUploadMiddleware = fileUpload({
  limits: { fileSize: 1024 * 1024 },
  abortOnLimit: true,
  useTempFiles: true,
})
