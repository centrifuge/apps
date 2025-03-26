import { Stack, Text } from '@centrifuge/fabric'

export function LayoutMain({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Stack py={5} as="section" gap={3} pt={20} pb={20}>
      <Stack gap={4}>
        <Stack>
          <Text as="h1" variant="heading1">
            {title}
          </Text>
          {subtitle && (
            <Text as="p" variant="heading4">
              {subtitle}
            </Text>
          )}
        </Stack>
        {children}
      </Stack>
    </Stack>
  )
}
