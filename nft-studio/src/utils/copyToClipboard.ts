export function copyToClipboard(value: string) {
  if (window.navigator && window.navigator.clipboard) {
    window.navigator.clipboard.writeText(value)
    return
  }

  const textField = document.createElement('textarea')
  textField.innerText = value
  document.body.appendChild(textField)
  textField.select()
  document.execCommand('copy')
  textField.remove()
}
