export const getFileDataURI = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener(
      'load',
      () => {
        if (!reader.result) {
          reject(`Error reading file '${file.name}'`)
        } else {
          resolve(reader.result.toString())
        }
      },
      false
    )
    reader.addEventListener(
      'error',
      () => {
        reject(`Error reading file '${file.name}'`)
      },
      false
    )
    reader.readAsDataURL(file)
  })
