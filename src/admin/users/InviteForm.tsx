import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, FormField, TextInput, Layer, RadioButton } from 'grommet';
import { User } from '../../common/models/user';
import * as Yup from 'yup'
import { Formik } from 'formik';
import { RequestState } from "../../store/reducers/http-request-reducer";
import { connect } from "react-redux";
import { invite } from "../../store/actions/users";
import { RouteComponentProps, withRouter } from "react-router";
import { PERMISSIONS } from "../../common/constants";

type InviteProps = {
  invite: (user) => void;
  reveal: () => void;
} & RouteComponentProps;

class InviteForm extends React.Component<InviteProps> {

  state = {
    selected: 'Funder',
  }

  onSubmit = async (user: User) => {
    await this.props.invite(user)
    this.revealForm()
  };

  revealForm = () => {
    this.props.reveal()
  }

  render() {

    const newUserValidation = Yup.object().shape({
      name: Yup.string()
          .max(40, 'Please enter no more than 40 characters')
          .required( 'This field is required'),
      email: Yup.string()
          .email('Please enter a valid email')
          .required('This field is required')
    });

    const user = new User();
    const { selected } = this.state

    return (
        <Layer onEsc={this.revealForm} onClickOutside={this.revealForm}>
          <Box align="center" justify="center">
            <Box
                width="medium"
                background="white"
                margin="medium"
                pad="medium"
            >
              <Formik
                  initialValues={user}
                  validationSchema={newUserValidation}
                  onSubmit={async (values) => {
                    await this.onSubmit(values)
                  }}
              >
                {
                  ({
                     values,
                     errors,
                     handleChange,
                     handleSubmit,
                   }) => (
                      <form
                          onSubmit={event => {
                            event.preventDefault();
                            handleSubmit();
                          }}
                      >
                        <Box gap="small">
                          <FormField
                              label="Name"
                              error={errors.name}
                          >
                            <TextInput
                                name="name"
                                value={values.name || ''}
                                onChange={handleChange}
                            />
                          </FormField>
                          <FormField
                              label="Email"
                              error={errors!.email}
                          >
                            <TextInput
                                name="email"
                                value={values!.email}
                                onChange={handleChange}
                            />
                          </FormField>

                          <Box direction={'row'} margin={{vertical: 'medium'}}>
                            {['Funder', 'Supplier', 'Admin'].map(label => {

                              return (
                                  <Box key={label} margin={{ horizontal: 'small' }}>
                                    <RadioButton
                                        name='button'
                                        checked={selected === label}
                                        label={label}
                                        onChange={() => {
                                          this.setState({selected: label})
                                          switch (label) {
                                            case 'Funder': {
                                              return values.permissions = [PERMISSIONS.CAN_FUND_INVOICES]
                                            }
                                            case 'Supplier': {
                                              return values.permissions = [PERMISSIONS.CAN_CREATE_INVOICES]
                                            }
                                            case 'Admin': {
                                              return values.permissions = [PERMISSIONS.CAN_MANAGE_USERS]
                                            }
                                          }
                                        }}
                                    />
                                  </Box>
                              )}
                            )}
                          </Box>

                          <Box direction="row" height="50px" justify={'between'}>
                            <Button
                                label="Discard"
                                onClick={ this.revealForm}
                            />
                            <Button
                                type="submit"
                                primary
                                label="Invite"
                            />
                          </Box>
                        </Box>
                      </form>
                  )
                }
              </Formik>
            </Box>
          </Box>
        </Layer>
    );
  }
}

const mapStateToProps = (state: { user: {
    invite: RequestState<User>,
  } }) => {
  return {
    isInvited: state.user.invite.data,
  };
}

export default connect(
    mapStateToProps,
    { invite },
)(withRouter(InviteForm))