import React, { FunctionComponent } from 'react';
import { FormField, Grid, TextArea } from 'grommet';
import { get } from 'lodash';
import { connect, FormikContext } from 'formik';
import { Document } from '../common/models/document';
import { Section } from '../components/Section';

type Props = OuterProps & {
  formik: FormikContext<Document>
};


interface OuterProps {
  columnGap: string;
  isViewMode: boolean;
}

const Comments: FunctionComponent<Props> = (props: Props) => {

  const {
    columnGap,
    isViewMode,
    formik: {
      values,
      errors,
      handleChange,
    },
  } = props;


  const key = `attributes.comments.value`;

  return <Section title="Comments">
    <Grid gap={columnGap}>
      <FormField
        key={key}
        error={get(errors, key)}
      >
          <TextArea
            disabled={isViewMode}
            value={get(values, key)}
            name={`${key}`}
            onChange={handleChange}
          />
      </FormField>
    </Grid>
  </Section>;
};

export default connect<OuterProps>(Comments);
