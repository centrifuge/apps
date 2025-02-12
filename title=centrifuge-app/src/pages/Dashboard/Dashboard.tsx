;<Select
  options={aumOptions}
  onChange={(e) => setSelectedAumOption(aumOptions.find((option) => option.value === e.target.value) ?? aumOptions[0])}
  value={selectedAumOption.value}
  variant="secondary"
  hideBorder
  small
/>
