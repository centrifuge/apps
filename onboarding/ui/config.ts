export interface Config {
  onboardingApiHost: string
}

const config: Config = {
  onboardingApiHost: process.env.NEXT_PUBLIC_ONBOARD_API_HOST || '',
}

export default config
