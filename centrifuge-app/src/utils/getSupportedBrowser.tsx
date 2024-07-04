// Function to detect the browser
export const getSupportedBrowser = () => {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'chrome'
  } else if (userAgent.includes('Firefox')) {
    return 'firefox'
  } else {
    return 'unknown'
  }
}
