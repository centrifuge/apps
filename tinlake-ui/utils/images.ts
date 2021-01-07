export const preload = (paths: string[]) => {
  for (var i = 0; i < paths.length; i++) {
    const image = document.createElement('img')
    image.setAttribute('alt', 'alt')
    image.setAttribute('src', paths[i])
  }
}
