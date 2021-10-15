const breakpoints = ['600px', '900px', '1200px', '1500px'] as string[] & { [key: string]: string }
breakpoints.S = breakpoints[0]
breakpoints.M = breakpoints[1]
breakpoints.L = breakpoints[2]
breakpoints.XL = breakpoints[3]

export { breakpoints }
