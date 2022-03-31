const cached = new WeakMap<File, string>()

export const getFileDataURI = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (cached.has(file)) resolve(cached.get(file)!)
    const reader = new FileReader()

    reader.addEventListener(
      'load',
      () => {
        if (!reader.result) {
          reject(`Error reading file '${file.name}'`)
        } else {
          const res = reader.result.toString()
          cached.set(file, res)
          resolve(res)
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
