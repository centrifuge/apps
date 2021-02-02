import React, { FunctionComponent } from 'react';
import { Grid } from 'grommet';
import { Section } from '../components/Section';
import AttributeField from './AttributeField';

interface Props {
  columnGap: string;
  attributes: any[];
  columnNo: number;
  size: string;
  name: string;
  isViewMode: boolean;
}

export const AttributeSection: FunctionComponent<Props> = props => {
  const { columnGap, size, isViewMode, columnNo, attributes, name } = props;

  const getSectionGridProps = size => {
    let numOfRows = columnNo;
    switch (size) {
      case 'medium':
        numOfRows = Math.min(4, numOfRows);
        break;
      case 'small':
        numOfRows = 1;
    }
    return {
      gap: columnGap,
      style: { gridTemplateColumns: `repeat(${numOfRows}, 1fr)` },
    };
  };

  return (
    <>
      <Section key={name} title={name}>
        <Grid {...getSectionGridProps(size)}>
          {props.children}
          {attributes.map(attr => {
            return (
              <AttributeField
                key={attr.name}
                attr={attr}
                isViewMode={isViewMode}
              />
            );
          })}
        </Grid>
      </Section>
    </>
  );
};

export default AttributeSection;
