import { httpRequestReducer } from '../http-request-reducer';
import { createContactAction } from '../../actions/contacts';
import { Contact } from '../../common/models/dto/contact';

export default httpRequestReducer<Contact>(createContactAction);
