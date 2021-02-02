import React, { FunctionComponent } from 'react';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import AttributeSection from './AttributeSection';

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


  const columnNo = (formFeatures && formFeatures.columnNo) ? formFeatures.columnNo : 1
  const defaultSectionName = formFeatures && formFeatures.defaultSection ? formFeatures.defaultSection : 'Attributes';
  const sections = {};
  // Group in sections
  attributes.forEach((attr) => {
    const sectionName = attr.section || defaultSectionName;
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(
      attr
    );
  });

  const sectionNames = Object.keys(sections);

  return <>
    {sectionNames.map(name => {
      return <AttributeSection name={name} attributes={sections[name]} columnGap={columnGap} size={size} columnNo={columnNo} isViewMode={isViewMode}/>
    })}
  </>;

};


export default Attributes;
