import { Box, Card, Flex, Grid, Shelf, Stack, Text, Tooltip } from '@centrifuge/fabric'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { formatBalance } from '../../utils/formatting'

const hexToRGB = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return {
    red: result?.[1] ? parseInt(result[1], 16) : 0,
    green: result?.[2] ? parseInt(result[2], 16) : 0,
    blue: result?.[3] ? parseInt(result[3], 16) : 0,
  }
}

const rgbToHSL = ({ red, green, blue }: { red: number; green: number; blue: number }) => {
  red /= 255
  green /= 255
  blue /= 255
  const l = Math.max(red, green, blue)
  const s = l - Math.min(red, green, blue)
  const h = s ? (l === red ? (green - blue) / s : l === green ? 2 + (blue - red) / s : 4 + (red - green) / s) : 0
  return [
    60 * h < 0 ? 60 * h + 360 : 60 * h,
    100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
    (100 * (2 * l - s)) / 2,
  ]
}

export const AssetsByMaturity = () => {
  const data = [
    { name: 'x-week', value: 75000, color: '#1253FF' },
    { name: 'x-week', value: 95000, color: '#001C66' },
    { name: 'x-week', value: 70000, color: '#B3C8FF' },
  ]

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    color,
  }: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
    color: string
  }) => {
    const isLight = rgbToHSL(hexToRGB(color))[2] >= 70
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        fontSize="12px"
        x={x}
        y={y}
        fill={isLight ? 'black' : 'white'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }
  return (
    <Card p={3}>
      <Stack gap={2} height="100%">
        <Text fontSize="18px" fontWeight={500}>
          Assets By Maturity
        </Text>
        <Grid height="100%" gridTemplateColumns="61fr 1fr 38fr">
          <ResponsiveContainer>
            <PieChart width={400} height={400}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                blendStroke
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <Flex height="100%" alignItems="center">
            <Flex height="82%" width="1px" backgroundColor="#EBEBEB" />
          </Flex>
          <Stack px={2} gap={2} justifyContent="center">
            {data.map((category) => (
              <Stack gap="4px">
                <Shelf gap={1}>
                  <Box background={category.color} borderRadius="50%" height="11px" width="11px" />
                  <Tooltip body="Tool tip">
                    <Text textAlign="left" variant="label2" color="textPrimary">
                      {category.name}
                    </Text>
                  </Tooltip>
                </Shelf>
                <Box ml="19px">
                  <Text variant="heading2">{formatBalance(category.value, 'USD', 2, 2)}</Text>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Stack>
    </Card>
  )
}
