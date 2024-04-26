export function getBasename(path: string) {
  const parts = path.split('/')
  const [, second, third] = parts

  if (second === 'ipfs') {
    return `/ipfs/${third}/`
  }

  if (second === 'ipns') {
    return `/ipns/${third}/`
  }

  return '/'
}
