import React, { FunctionComponent } from 'react';
import { Schema } from '../common/models/schema';
import { Grid } from 'grommet';
import { Section } from '../components/Section';
import AttributeField from './AttributeField';

interface Props {
  columnGap: string,
  schema: Schema,
  size: string;
  isViewMode: boolean;
}

export const Attributes: FunctionComponent<Props> = (props: Props) => {

  const {
    columnGap,
    size,
    isViewMode,
    schema,
  } = props;

  const { formFeatures, attributes } = schema;

  const getSectionGridProps = (size) => {

    let numOfRows = (formFeatures && formFeatures.columnNo) ? formFeatures.columnNo : 1;
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


  const defaultSectionName = formFeatures && formFeatures.defaultSection ? formFeatures.defaultSection : 'Attributes';
  const sections = {};
  // Group in sections
  attributes.forEach((attr) => {
    const sectionName = attr.section || defaultSectionName;
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(
      <AttributeField key={attr.name} attr={attr} isViewMode={isViewMode}/>,
    );
  });

  const sectionNames = Object.keys(sections);

  return <>
    {sectionNames.map(name => {
      return <Section title={name}>
        <Grid {...getSectionGridProps(size)}>
          {sections[name]}
        </Grid>
      </Section>;
    })}
  </>;

};


export default Attributes;
