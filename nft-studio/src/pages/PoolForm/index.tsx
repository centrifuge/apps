import { AnchorButton, Box, Button, Grid, IconPlus, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { FileInput } from '../../components/FileInput'
import { RadioInput } from '../../components/RadioInput'
import { PageWithSideBar } from '../../components/shared/PageWithSideBar'
import { TextInput } from '../../components/TextInput'

const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

const validateImageFile = (file: File) => {
  if (!isImageFile(file)) {
    console.error(`Only image files are allowed (selected file of type ${file.type})`)
    return false
  }
  return true
}

const ASSET_CLASS = [
  { label: 'Asset class 1', id: 'assetClass1' },
  { label: 'Asset class 2', id: 'assetClass2' },
  { label: 'Asset class 3', id: 'assetClass3' },
]

export const PoolFormPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreatePoolForm />
    </PageWithSideBar>
  )
}

const CreatePoolForm: React.FC = () => {
  const [poolName, setPoolName] = React.useState<string>('')
  const [assetClass, setAssetClass] = React.useState<string>('')
  const [currency, setCurrency] = React.useState<string>('')
  const [discountRate, setDiscountRate] = React.useState<string>('')
  const [minEpochDuration, setMinEpochDuration] = React.useState<string>('')
  const [challengeTime, setChallengeTime] = React.useState<string>('')
  const [tranche, setTranche] = React.useState<string>('')
  const [tokenName, setTokenName] = React.useState<string>('')
  const [interestRate, setInterestRate] = React.useState<string>('')
  const [minRiskBuffer, setMinRiskBuffer] = React.useState<string>('')

  // TODO: call centrifuge-js and create pool
  const onSubmit = () => {
    console.log('submit pool:', {
      currency,
      minEpochDuration,
      challengeTime,
      poolName,
      assetClass,
      discountRate,
      tranche,
      tokenName,
      interestRate,
      minRiskBuffer,
    })
  }

  return (
    <Grid columns={[10]} equalColumns gap={['gutterMobile', 'gutterTablet', 'gutterDesktop']}>
      <Stack gap="3" gridColumn="1 / 5">
        <TextInput
          label="Pool name"
          placeholder="Untitled pool"
          value={poolName}
          onChange={(ev) => {
            setPoolName(ev.target.value)
          }}
        />

        <Stack gap="1">
          <Text variant="label1">Asset class</Text>
          <Shelf gap="4">
            {ASSET_CLASS.map(({ label, id }) => (
              <RadioInput
                key={id}
                label={label}
                checked={assetClass === id}
                name="assetClass"
                onChange={(ev) => {
                  setAssetClass(id)
                }}
              />
            ))}
          </Shelf>
        </Stack>

        <Stack gap="1">
          <Text variant="label1">Pool icon</Text>
          <FileInput
            onFileUpdate={(...a) => {
              console.log('Pool icon file update', a)
            }}
            onBeforeFileUpdate={validateImageFile}
          />
        </Stack>

        <Stack gap="1">
          <Text variant="label1">Issuer logo</Text>
          <FileInput
            onFileUpdate={(...a) => {
              console.log('Issuer logo file update', a)
            }}
            onBeforeFileUpdate={validateImageFile}
          />
        </Stack>

        <Select
          label="Currency"
          placeholder="Select..."
          options={[{ value: 'dai', label: 'DAI' }]}
          onSelect={(key) => {
            if (key) {
              setCurrency(key)
            }
          }}
        />

        <TextInput
          label="Discount rate"
          placeholder="0.00%"
          value={discountRate}
          onChange={(ev) => {
            setDiscountRate(ev.target.value)
          }}
        />

        <Select
          label="Minimum epoch duration"
          placeholder="Select..."
          options={[{ value: '24h', label: '24 hours' }]}
          onSelect={(key) => {
            if (key) {
              setMinEpochDuration(key)
            }
          }}
        />

        <Select
          label="Challenge time"
          placeholder="Select..."
          options={[{ value: '30m', label: '30 minutes' }]}
          onSelect={(key) => {
            if (key) {
              setChallengeTime(key)
            }
          }}
        />
      </Stack>
      <Stack gap="4" gridColumn="6 / 9" marginTop="9">
        <Text variant="heading3">Tranches</Text>
        <Select
          label="Tranche"
          placeholder="Select..."
          options={[
            { value: 'senior', label: 'Senior' },
            { value: 'junior', label: 'Junior' },
          ]}
          onSelect={(key) => {
            if (key) {
              setTranche(key)
            }
          }}
        />
        <TextInput
          label="Token name"
          placeholder="SEN"
          value={tokenName}
          onChange={(ev) => {
            setTokenName(ev.target.value)
          }}
        />
        <TextInput
          label="Interest rate"
          placeholder="0.00%"
          value={interestRate}
          onChange={(ev) => {
            setInterestRate(ev.target.value)
          }}
        />
        <TextInput
          label="Minimum risk buffer"
          placeholder="0.00%"
          value={minRiskBuffer}
          onChange={(ev) => {
            setMinRiskBuffer(ev.target.value)
          }}
        />

        <Box borderBottomWidth="1px" borderBottomStyle="solid" borderBottomColor="borderPrimary" />

        <Box>
          <Button variant="text" icon={<IconPlus />}>
            Add another tranche
          </Button>
        </Box>
      </Stack>
      <Stack gap="3" gridColumn="9 / 11">
        <Shelf gap="2">
          <AnchorButton variant="outlined" href="/managed-pools">
            Cancel
          </AnchorButton>
          <Button variant="contained" onClick={onSubmit}>
            Create
          </Button>
        </Shelf>
      </Stack>
    </Grid>
  )
}
