const space = [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80] as number[] & { [key: string]: number }

space.gutterMobile = space[2]
space.gutterTablet = space[2]
space.gutterDesktop = space[3]

export { space }
