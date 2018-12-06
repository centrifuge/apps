import { httpRequestReducer } from '../http-request-reducer';
import { Contact } from '../../common/models/dto/contact';
import { getContactsAction } from '../../actions/contacts';

export default httpRequestReducer<Contact[]>(getContactsAction);
