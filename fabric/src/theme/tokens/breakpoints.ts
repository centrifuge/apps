const breakpoints = ['600px', '900px', '1200px', '1500px'] as string[] & { [key: string]: string }
breakpoints.small = breakpoints[0]
breakpoints.medium = breakpoints[1]
breakpoints.large = breakpoints[2]
breakpoints.xlarge = breakpoints[3]

export { breakpoints }
