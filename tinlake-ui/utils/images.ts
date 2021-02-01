export const preload = (paths: string[]) => {
  for (let i = 0; i < paths.length; i += 1) {
    const image = document.createElement('img')
    image.setAttribute('alt', 'alt')
    image.setAttribute('src', paths[i])
  }
}
