import { httpRequestReducer } from '../http-request-reducer';
import { userLoginActionTypes } from '../../actions/users';

export default httpRequestReducer<string>(userLoginActionTypes);
