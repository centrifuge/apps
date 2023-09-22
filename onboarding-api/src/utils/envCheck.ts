const devEnvs = ['algol', 'development', 'catalyst']
export const IS_DEV_ENV = devEnvs.some((env) => process.env.COLLATOR_WSS_URL.includes(env))
