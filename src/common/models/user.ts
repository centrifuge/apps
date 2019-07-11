import { PERMISSIONS } from '../constants';

export interface IUser {
  name: string;
  password?: string;
  email: string;
  _id?: string;
  account: string;
  permissions: PERMISSIONS[];
  schemas?: string[];
  enabled: boolean;
  invited: boolean;
}

export class User implements IUser{
  name: string;
  password?: string = "";
  email: string;
  _id?: string;
  account: string = "";
  permissions: PERMISSIONS[] = [];
  schemas: string[] = [];
  enabled: boolean;
  invited: boolean;
}
