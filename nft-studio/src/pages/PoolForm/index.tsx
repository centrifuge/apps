import { AnchorButton, Box, Button, Grid, IconPlus, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { FileInput } from '../../components/FileInput'
import { RadioInput } from '../../components/RadioInput'
import { PageWithSideBar } from '../../components/shared/PageWithSideBar'
import { TextInput } from '../../components/TextInput'
import { createPool } from './createPool'

const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

const validateImageFile = (file: File) => {
  if (!isImageFile(file)) {
    console.error(`Only image files are allowed (selected file of type ${file.type})`)
    return false
  }
  return true
}

const DEFAULT_CURRENCY = 'Usd'
const ASSET_CLASS = ['Real Estate', 'Revenue Based Financing', 'Invoice Factoring'].map((label) => ({
  label,
  id: label,
}))

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
  const [maxReserve, setMaxReserve] = React.useState<string>('')
  const [tranche, setTranche] = React.useState<string>('')
  const [tokenName, setTokenName] = React.useState<string>('')
  const [interestRate, setInterestRate] = React.useState<string>('')
  const [minRiskBuffer, setMinRiskBuffer] = React.useState<string>('')
  const [issuerLogoFile, setIssuerLogoFile] = React.useState<File>()

  const currency = DEFAULT_CURRENCY

  // TODO: call centrifuge-js and create pool
  const onSubmit = () => {
    createPool({
      poolName,
      assetClass,
      currency,
      maxReserve,
      tranche,
      tokenName,
      interestRate,
      minRiskBuffer,
      issuerLogoFile,
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
          <Text variant="label1">Issuer logo</Text>
          <FileInput
            onFileUpdate={(file) => {
              setIssuerLogoFile(file)
            }}
            onBeforeFileUpdate={validateImageFile}
          />
        </Stack>

        <TextInput
          label="Max reserve"
          placeholder="0"
          value={maxReserve}
          onChange={(ev) => {
            setMaxReserve(ev.target.value)
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
